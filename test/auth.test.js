const supertest = require("supertest");
const app = require("../app");
const removeTestUser = require("./utils/removeUserTest.util");

describe("akses Testing", () => {
  afterAll(async () => {
    await removeTestUser("usertesting");
  });

  it("Register User", async () => {
    const result = await supertest(app).post("/register").send({
      name: "User Testing",
      email: "usertesting@mail.com",
      password: "usertesting@mail.com",
      username: "usertesting",
    });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe("User created successfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("User Testing");
    expect(result.body.data.username).toBe("usertesting");
    expect(result.body.data.avatarUrl).toBeNull();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();
  });

  it("Login", async () => {
    const result = await supertest(app).post("/login").send({
      email: "usertesting@mail.com",
      password: "usertesting@mail.com",
    });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Login sucessfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("User Testing");
    expect(result.body.data.username).toBe("usertesting");
    expect(result.body.data.avatarUrl).toBeNull();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();
  });
});
