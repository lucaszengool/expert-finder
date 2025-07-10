#!/usr/bin/env python3
import re

with open('app/services/expert_service.py', 'r') as f:
    content = f.read()

# Add import for DB models
if 'from app.models.db_models import' not in content:
    # Add after other imports
    import_section = re.search(r'(from app\.models.*?\n)', content)
    if import_section:
        content = content.replace(
            import_section.group(0),
            import_section.group(0) + 'from app.models.db_models import ExpertDB\n'
        )
    else:
        content = 'from app.models.db_models import ExpertDB\n' + content

# Replace db.query(Expert) with db.query(ExpertDB)
content = content.replace('db.query(Expert)', 'db.query(ExpertDB)')

# Update the methods to convert between DB and Pydantic models
# Fix get_experts method
content = re.sub(
    r'def get_experts\(self,[^}]+?\n        return db\.query\(ExpertDB\)\.offset\(skip\)\.limit\(limit\)\.all\(\)',
    '''def get_experts(self, skip: int = 0, limit: int = 100, db=None):
        if db:
            db_experts = db.query(ExpertDB).offset(skip).limit(limit).all()
            return [Expert(**{
                'id': e.id,
                'name': e.name,
                'title': e.title or '',
                'email': e.email or '',
                'location': e.location or '',
                'organization': e.organization or '',
                'bio': e.bio or '',
                'skills': e.skills or [],
                'experience': e.experience or [],
                'links': e.links or {},
                'source': e.source or 'unknown'
            }) for e in db_experts]
        return []''',
    content,
    flags=re.DOTALL
)

# Fix create_expert method
content = re.sub(
    r'def create_expert\(self,[^}]+?\n        db\.refresh\(db_expert\)\n        return db_expert',
    '''def create_expert(self, expert: Expert, db=None):
        if db:
            db_expert = ExpertDB(
                name=expert.name,
                title=expert.title,
                email=expert.email,
                location=expert.location,
                organization=expert.organization,
                bio=expert.bio,
                skills=expert.skills,
                experience=expert.experience,
                links=expert.links,
                source=expert.source
            )
            db.add(db_expert)
            db.commit()
            db.refresh(db_expert)
            return Expert(**{
                'id': db_expert.id,
                'name': db_expert.name,
                'title': db_expert.title or '',
                'email': db_expert.email or '',
                'location': db_expert.location or '',
                'organization': db_expert.organization or '',
                'bio': db_expert.bio or '',
                'skills': db_expert.skills or [],
                'experience': db_expert.experience or [],
                'links': db_expert.links or {},
                'source': db_expert.source or 'unknown'
            })
        return expert''',
    content,
    flags=re.DOTALL
)

with open('app/services/expert_service.py', 'w') as f:
    f.write(content)

print("✅ Updated expert_service.py")
