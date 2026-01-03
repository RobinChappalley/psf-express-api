# List of automated tests

| Test Suite         | Route       | Test Description                                                | Who created it | Validation |
| ------------------ | ----------- | --------------------------------------------------------------- | -------------- | ---------- |
| spec/users.spec.js | POST /users | should create a user with minimum of data                       | Joanah         | Ok         |
| spec/users.spec.js | POST /users | should create a user with an account (email and password)       | Joanah         | Ok         |
| spec/users.spec.js | POST /users | should create a user ACCOMPAGNANT with all fields except parent | Joanah         | Ok         |
| spec/users.spec.js | GET /users  | should retrieve all users                                       | Joanah         | Ok         |
