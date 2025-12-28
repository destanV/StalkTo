# Versioning

Use Semantic Versioning: MAJOR.MINOR.PATCH.

Expose runtime info via GET /version:
- service
- version
- commit (CI should set)
- buildTime (CI should set)

Docker image tags should match your service versions.
