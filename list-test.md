# List of automated tests

| Test Suite                  | Route                                       | Test Description                                                | Who created it | Validation |
| --------------------------- | ------------------------------------------- | --------------------------------------------------------------- | -------------- | ---------- |
| spec/users.spec.js          | GET /users                                  | should retrieve all users                                       | Joanah         | Ok         |
| spec/users.spec.js          | GET /users/:id                              | should retrieve a user by id                                    | Joanah         | Ok         |
| spec/users.spec.js          | POST /users                                 | should create a user with minimum of data                       | Joanah         | Ok         |
| spec/users.spec.js          | POST /users                                 | should create a user with an account (email and password)       | Joanah         | Ok         |
| spec/users.spec.js          | POST /users                                 | should create a user ACCOMPAGNANT with all fields except parent | Joanah         | Ok         |
| spec/users.spec.js          | PUT /users/:id                              | should update a user by id                                      | Joanah         | Ok         |
| spec/users.spec.js          | DELETE /users/:id                           | should delete a user by id                                      | Joanah         | Ok         |
| spec/login.spec.js          | POST /login                                 | should login successfully with valid credentials                | Robin          | Ok         |
| spec/login.spec.js          | POST /login                                 | should return a JWT token on successful login                   | Robin          | Ok         |
| spec/login.spec.js          | POST /login                                 | should fail with incorrect password                             | Robin          | Ok         |
| spec/login.spec.js          | POST /login                                 | should fail if user does not exist                              | Robin          | Ok         |
| spec/camps.spec.js          | POST /camps                                 | should create a new camp with basic info                        | Robin          | Ok         |
| spec/camps.spec.js          | POST /camps                                 | should create a second camp                                     | Robin          | Ok         |
| spec/camps.spec.js          | POST /camps                                 | should fail validation if title is missing                      | Robin          | Ok         |
| spec/camps.spec.js          | POST /camps                                 | should fail if title is not unique                              | Robin          | Ok         |
| spec/camps.spec.js          | GET /camps                                  | should retrieve all camps                                       | Robin          | Ok         |
| spec/camps.spec.js          | GET /camps/:id                              | should retrieve a camp by id                                    | Robin          | Ok         |
| spec/camps.spec.js          | PUT /camps/:id                              | should update camp title                                        | Robin          | Ok         |
| spec/camps.spec.js          | PUT /camps/:id                              | should return 404 for non-existent camp ID                      | Robin          | Ok         |
| spec/camps.spec.js          | DELETE /camps/:id                           | should delete a camp                                            | Robin          | Ok         |
| spec/camps.spec.js          | DELETE /camps/:id                           | should return 404 if camp not found                             | Robin          | Ok         |
| spec/camp-trainings.spec.js | GET /camps/:campId/trainings                | should retrieve all trainings from a camp                       | Robin          | Ok         |
| spec/camp-trainings.spec.js | GET /camps/:campId/trainings                | should return empty array if camp has no trainings              | Robin          | Ok         |
| spec/camp-trainings.spec.js | GET /camps/:campId/trainings/:trainingId    | should return one specific training by ID                       | Robin          | Ok         |
| spec/camp-trainings.spec.js | GET /camps/:campId/trainings                | should return 404 for non-existent camp                         | Robin          | Ok         |
| spec/camp-trainings.spec.js | POST /camps/:campId/trainings               | should add a new training to camp                               | Robin          | Ok         |
| spec/camp-trainings.spec.js | POST /camps/:campId/trainings               | should create training with minimal data                        | Robin          | Ok         |
| spec/camp-trainings.spec.js | POST /camps/:campId/trainings               | should return 404 for non-existent camp                         | Robin          | Ok         |
| spec/camp-trainings.spec.js | PUT /camps/:campId/trainings/:trainingId    | should update an existing training                              | Robin          | Ok         |
| spec/camp-trainings.spec.js | PUT /camps/:campId/trainings/:trainingId    | should update only specified fields                             | Robin          | Ok         |
| spec/camp-trainings.spec.js | PUT /camps/:campId/trainings/:trainingId    | should return 404 for non-existent training                     | Robin          | Ok         |
| spec/camp-trainings.spec.js | PUT /camps/:campId/trainings/:trainingId    | should return 404 for non-existent camp                         | Robin          | Ok         |
| spec/camp-trainings.spec.js | PUT /camps/:campId/trainings/:trainingId    | should return 400 for invalid training ID                       | Robin          | Ok         |
| spec/camp-trainings.spec.js | DELETE /camps/:campId/trainings/:trainingId | should delete a training from camp                              | Robin          | Ok         |
| spec/camp-trainings.spec.js | DELETE /camps/:campId/trainings/:trainingId | should return 404 for non-existent training                     | Robin          | Ok         |
| spec/camp-trainings.spec.js | DELETE /camps/:campId/trainings/:trainingId | should return 404 for non-existent camp                         | Robin          | Ok         |
| spec/camp-trainings.spec.js | DELETE /camps/:campId/trainings/:trainingId | should return 404 for invalid training ID                       | Robin          | Ok         |
| spec/items.spec.js          | POST /items                                 | should create a new item                                        | Robin          | Ok         |
| spec/items.spec.js          | POST /items                                 | should create a second new item                                 | Robin          | Ok         |
| spec/items.spec.js          | POST /items                                 | should fail without required slug field                         | Robin          | Ok         |
| spec/items.spec.js          | POST /items                                 | should fail without required name field                         | Robin          | Ok         |
| spec/items.spec.js          | POST /items                                 | should fail with duplicate slug                                 | Robin          | Ok         |
| spec/items.spec.js          | GET /items                                  | should retrieve the list of all items                           | Robin          | Ok         |
| spec/items.spec.js          | GET /items/:id                              | should retrieve a specific item by ID                           | Robin          | Ok         |
| spec/items.spec.js          | PUT /items/:id                              | should update an existing item                                  | Robin          | Ok         |
| spec/items.spec.js          | PUT /items/:id                              | should update only the slug                                     | Robin          | Ok         |
| spec/items.spec.js          | PUT /items/:id                              | should return 404 for non-existent item                         | Robin          | Ok         |
| spec/items.spec.js          | DELETE /items/:id                           | should delete an existing item                                  | Robin          | Ok         |
| spec/items.spec.js          | DELETE /items/:id                           | should return 404 for non-existent item                         | Robin          | Ok         |
