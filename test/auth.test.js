const supertest = require("supertest");
const app = require("../app");
const removeTestUser = require("./utils/removeUserTest.util");
const APITestVersion = "v1";
const googleIdToken = process.env.TEST_GOOGLE_ID_TOKEN;
const facebookIdToken = process.env.TEST_FACEBOOK_ID_TOKEN;

let googleUsernameTestTest = "";
let facebookUsernameTestTest = "";

describe("akses Testing", () => {
  it("201 > Register User", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/register`)
      .send({
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

  it("400 > Validation Input", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/register`)
      .send({
        name: "",
        email: "usertesting@mail.com",
        password: "",
        username: "usertesting",
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBe(
      "Validation failed, entered data is incorrect."
    );
    expect(result.body.errors).toBeDefined();
  });

  it("200 > Login", async () => {
    const result = await supertest(app).post(`/${APITestVersion}/login`).send({
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

  it("401 > Invalid Email or Password", async () => {
    const result = await supertest(app).post(`/${APITestVersion}/login`).send({
      email: "usertesting@mail.coma",
      password: "usertesting@mail.coma",
    });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Invalid email or password");
  });

  it("201 > Create New Account With Google", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/login-with-google`)
      .send({
        googleIdToken,
      });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe("User created successfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("Adi Kurniawan");
    expect(result.body.data.username).toBeDefined();
    expect(result.body.data.avatarUrl).toBeDefined();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();
  });

  it("200 > Login With Google", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/login-with-google`)
      .send({
        googleIdToken,
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Login sucessfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("Adi Kurniawan");
    expect(result.body.data.username).toBeDefined();
    expect(result.body.data.avatarUrl).toBeDefined();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();

    googleUsernameTestTest = result.body.data.username;
  });

  it("201 > Create New Account With Facebook", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/login-with-facebook`)
      .send({
        facebookIdToken,
      });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe("User created successfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("Adi Kurniawan");
    expect(result.body.data.username).toBeDefined();
    expect(result.body.data.avatarUrl).toBeDefined();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();
  });

  it("200 > Login With Facebook", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/login-with-facebook`)
      .send({
        facebookIdToken,
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Login sucessfully");
    expect(result.body.data.publicId).toBeDefined();
    expect(result.body.data.name).toBe("Adi Kurniawan");
    expect(result.body.data.username).toBeDefined();
    expect(result.body.data.avatarUrl).toBeDefined();
    expect(result.body.token.accessToken).toBeDefined();
    expect(result.body.token.refreshToken).toBeDefined();

    facebookUsernameTestTest = result.body.data.username;
  });

  afterAll(async () => {
    await removeTestUser("usertesting");
  });

  afterAll(async () => {
    await removeTestUser(googleUsernameTestTest);
  });

  afterAll(async () => {
    await removeTestUser(facebookUsernameTestTest);
  });
});
