#!/usr/bin/env python3
"""
Pre-flight check for backend code
Tests all imports and syntax before Docker build
"""
import os
import sys
import ast
import importlib.util
import traceback
from pathlib import Path
import subprocess
import tempfile
import shutil

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_status(status, message):
    if status == "success":
        print(f"{Colors.GREEN}✓{Colors.ENDC} {message}")
    elif status == "error":
        print(f"{Colors.RED}✗{Colors.ENDC} {message}")
    elif status == "warning":
        print(f"{Colors.YELLOW}⚠{Colors.ENDC} {message}")
    elif status == "info":
        print(f"{Colors.BLUE}ℹ{Colors.ENDC} {message}")

def check_syntax(file_path):
    """Check Python syntax without executing"""
    try:
        with open(file_path, 'r') as f:
            ast.parse(f.read())
        return True, None
    except SyntaxError as e:
        return False, f"Syntax error at line {e.lineno}: {e.msg}"
    except Exception as e:
        return False, str(e)

def check_imports(file_path):
    """Check if all imports in a file can be resolved"""
    errors = []
    with open(file_path, 'r') as f:
        tree = ast.parse(f.read())
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_name = alias.name
                if not can_import(module_name):
                    errors.append(f"Cannot import '{module_name}'")
        elif isinstance(node, ast.ImportFrom):
            module_name = node.module
            if module_name and not can_import(module_name):
                errors.append(f"Cannot import from '{module_name}'")
            for alias in node.names:
                import_name = f"{module_name}.{alias.name}" if module_name else alias.name
                # Don't check individual names, just module existence
    
    return errors

def can_import(module_name):
    """Check if a module can be imported"""
    if module_name.startswith('app.'):
        # For local app modules, check if file exists
        path = module_name.replace('.', '/') + '.py'
        return os.path.exists(path) or os.path.exists(module_name.replace('.', '/'))
    else:
        # For external modules, try to find spec
        try:
            return importlib.util.find_spec(module_name) is not None
        except:
            return False

def find_missing_imports(file_path):
    """Find all undefined names that might be missing imports"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    try:
        tree = ast.parse(content)
    except:
        return []
    
    # Common types that need imports
    common_imports = {
        'Dict': 'from typing import Dict',
        'List': 'from typing import List',
        'Optional': 'from typing import Optional',
        'Any': 'from typing import Any',
        'Union': 'from typing import Union',
        'Tuple': 'from typing import Tuple',
        'Set': 'from typing import Set',
        'datetime': 'from datetime import datetime',
        'date': 'from datetime import date',
        'timedelta': 'from datetime import timedelta',
        'Enum': 'from enum import Enum',
        'BaseModel': 'from pydantic import BaseModel',
        'Field': 'from pydantic import Field',
        'HTTPException': 'from fastapi import HTTPException',
        'Depends': 'from fastapi import Depends',
        'APIRouter': 'from fastapi import APIRouter',
        'Query': 'from fastapi import Query',
        'Path': 'from fastapi import Path',
        'Body': 'from fastapi import Body',
    }
    
    # Get all names used
    class NameVisitor(ast.NodeVisitor):
        def __init__(self):
            self.names = set()
            self.defined = set()
        
        def visit_Name(self, node):
            if isinstance(node.ctx, ast.Load):
                self.names.add(node.id)
            elif isinstance(node.ctx, ast.Store):
                self.defined.add(node.id)
            self.generic_visit(node)
        
        def visit_FunctionDef(self, node):
            self.defined.add(node.name)
            self.generic_visit(node)
        
        def visit_ClassDef(self, node):
            self.defined.add(node.name)
            self.generic_visit(node)
        
        def visit_Import(self, node):
            for alias in node.names:
                name = alias.asname if alias.asname else alias.name
                self.defined.add(name)
            self.generic_visit(node)
        
        def visit_ImportFrom(self, node):
            for alias in node.names:
                name = alias.asname if alias.asname else alias.name
                self.defined.add(name)
            self.generic_visit(node)
    
    visitor = NameVisitor()
    visitor.visit(tree)
    
    undefined = visitor.names - visitor.defined
    missing_imports = []
    
    for name in undefined:
        if name in common_imports:
            missing_imports.append((name, common_imports[name]))
    
    return missing_imports

def fix_file(file_path, auto_fix=False):
    """Check and optionally fix a Python file"""
    print(f"\n{Colors.BOLD}Checking {file_path}{Colors.ENDC}")
    
    issues = []
    
    # Check syntax
    syntax_ok, syntax_error = check_syntax(file_path)
    if not syntax_ok:
        issues.append(("syntax", syntax_error))
        print_status("error", f"Syntax error: {syntax_error}")
        return issues  # Can't proceed if syntax is broken
    else:
        print_status("success", "Syntax OK")
    
    # Check imports
    import_errors = check_imports(file_path)
    if import_errors:
        for error in import_errors:
            issues.append(("import", error))
            print_status("error", error)
    
    # Find missing imports
    missing_imports = find_missing_imports(file_path)
    if missing_imports:
        print_status("warning", f"Found {len(missing_imports)} potentially missing imports")
        for name, import_stmt in missing_imports:
            print(f"  - {name}: {import_stmt}")
            issues.append(("missing_import", (name, import_stmt)))
        
        if auto_fix:
            # Add missing imports
            with open(file_path, 'r') as f:
                lines = f.readlines()
            
            # Find where to insert imports (after existing imports)
            import_end = 0
            for i, line in enumerate(lines):
                if line.strip().startswith(('import ', 'from ')):
                    import_end = i + 1
                elif import_end > 0 and line.strip() and not line.strip().startswith('#'):
                    break
            
            # Add missing imports
            new_imports = [f"{import_stmt}\n" for _, import_stmt in missing_imports]
            lines[import_end:import_end] = new_imports
            
            with open(file_path, 'w') as f:
                f.writelines(lines)
            
            print_status("success", f"Added {len(missing_imports)} missing imports")
    
    if not issues:
        print_status("success", "No issues found")
    
    return issues

def check_all_files(directory="app", auto_fix=False):
    """Check all Python files in directory"""
    print(f"{Colors.BOLD}Running pre-flight checks on {directory}{Colors.ENDC}")
    print("=" * 60)
    
    all_issues = {}
    py_files = list(Path(directory).rglob("*.py"))
    
    print(f"Found {len(py_files)} Python files to check\n")
    
    for file_path in sorted(py_files):
        if "__pycache__" in str(file_path):
            continue
        
        issues = fix_file(str(file_path), auto_fix=auto_fix)
        if issues:
            all_issues[str(file_path)] = issues
    
    # Summary
    print(f"\n{Colors.BOLD}Summary{Colors.ENDC}")
    print("=" * 60)
    
    if all_issues:
        print_status("error", f"Found issues in {len(all_issues)} files:")
        for file_path, issues in all_issues.items():
            print(f"\n{file_path}:")
            for issue_type, issue_detail in issues:
                if issue_type == "missing_import":
                    print(f"  - Missing import: {issue_detail[0]}")
                else:
                    print(f"  - {issue_type}: {issue_detail}")
        
        if not auto_fix:
            print(f"\n{Colors.YELLOW}Run with --fix to automatically add missing imports{Colors.ENDC}")
        
        return False
    else:
        print_status("success", "All files passed pre-flight checks!")
        return True

def test_docker_env():
    """Test if code will work in Docker environment"""
    print(f"\n{Colors.BOLD}Testing Docker environment compatibility{Colors.ENDC}")
    print("=" * 60)
    
    # Check for hardcoded paths
    issues = []
    for file_path in Path("app").rglob("*.py"):
        if "__pycache__" in str(file_path):
            continue
        
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check for hardcoded paths
        if '/Users/' in content or 'C:\\' in content or 'C:/' in content:
            issues.append(f"{file_path}: Contains hardcoded paths")
        
        # Check for localhost references
        if 'localhost' in content and 'DATABASE_URL' not in content:
            issues.append(f"{file_path}: Contains 'localhost' reference")
    
    if issues:
        print_status("warning", "Found Docker compatibility issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print_status("success", "No Docker compatibility issues found")
    
    return len(issues) == 0

def create_test_script():
    """Create a script that tests all imports in isolated environment"""
    test_script = '''
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock external dependencies
import unittest.mock as mock

# Mock database connections
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['TESTING'] = 'true'

# Mock external services
with mock.patch('sqlalchemy.create_engine'):
    with mock.patch('chromadb.PersistentClient'):
        with mock.patch('redis.Redis'):
            print("Testing all imports...")
            
            try:
                from app.main import app
                print("✓ All imports successful!")
            except Exception as e:
                print(f"✗ Import failed: {e}")
                import traceback
                traceback.print_exc()
                sys.exit(1)
'''
    
    with open('test_imports.py', 'w') as f:
        f.write(test_script)
    
    # Run the test
    result = subprocess.run([sys.executable, 'test_imports.py'], capture_output=True, text=True)
    
    if result.returncode == 0:
        print_status("success", "Import test passed")
    else:
        print_status("error", "Import test failed")
        print(result.stdout)
        print(result.stderr)
    
    # Cleanup
    os.remove('test_imports.py')
    
    return result.returncode == 0

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Pre-flight check for Python code')
    parser.add_argument('--fix', action='store_true', help='Auto-fix missing imports')
    parser.add_argument('--test', action='store_true', help='Run import tests')
    args = parser.parse_args()
    
    # Run checks
    success = check_all_files(auto_fix=args.fix)
    
    # Test Docker compatibility
    docker_ok = test_docker_env()
    
    # Run import test if requested
    if args.test:
        import_ok = create_test_script()
        success = success and import_ok
    
    if success and docker_ok:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All checks passed! Ready for Docker build.{Colors.ENDC}")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Issues found. Fix them before building Docker.{Colors.ENDC}")
        sys.exit(1)
