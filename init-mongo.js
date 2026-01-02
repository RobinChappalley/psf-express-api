const testdb = "psf-app-test";
db = db.getSiblingDB("admin");
db.createUser({
  user: "test",
  pwd: "rando",
  roles: [
    {
      role: "dbOwner",
      db: testdb,
    },
  ],
});
