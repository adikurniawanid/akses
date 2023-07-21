const supertest = require("supertest");
const app = require("../app");
const removeTestUser = require("./utils/removeUserTest.util");
const APITestVersion = "v1";
const testIdToken = require("./testIdToken.json");

const googleIdToken = testIdToken.TEST_GOOGLE_ID_TOKEN;
const facebookIdToken = testIdToken.TEST_FACEBOOK_ID_TOKEN;

let googleUsernameTest = "";
let facebookUsernameTest = "";
let publicIdTest = "";
let refreshTokenTest = "";

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

    publicIdTest = result.body.data.publicId;
    refreshTokenTest = result.body.token.refreshToken;
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

    googleUsernameTest = result.body.data.username;
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

    facebookUsernameTest = result.body.data.username;
  });

  it("200 > Success Refresh Token", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/refresh-token`)
      .send({
        refreshToken: refreshTokenTest,
      });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe("Access token created successfully");
    expect(result.body.token.accessToken).toBeDefined();
  });

  it("400 > Validation Refresh Token", async () => {
    const result = await supertest(app).post(
      `/${APITestVersion}/refresh-token`
    );

    expect(result.status).toBe(400);
    expect(result.body.message).toBe(
      "Validation failed, entered data is incorrect."
    );
    expect(result.body.errors).toBeDefined();
  });

  it("401 > Invalid Refresh Token", async () => {
    const result = await supertest(app)
      .post(`/${APITestVersion}/refresh-token`)
      .send({
        refreshToken: refreshTokenTest.replace("a", "b"),
      });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Invalid refresh token");
  });

  it("200 > Logout", async () => {
    const result = await supertest(app).post(`/${APITestVersion}/logout`).send({
      publicId: publicIdTest,
    });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe("Logout successfully");
  });

  it("400 > Validation Logout", async () => {
    const result = await supertest(app).post(`/${APITestVersion}/logout`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe(
      "Validation failed, entered data is incorrect."
    );
    expect(result.body.errors).toBeDefined();
  });

  it("404 > User Not Found", async () => {
    const result = await supertest(app).post(`/${APITestVersion}/logout`).send({
      publicId: "publicIdTest",
    });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe("User not found");
  });

  afterAll(async () => {
    await removeTestUser("usertesting");
  });

  afterAll(async () => {
    await removeTestUser(googleUsernameTest);
  });

  afterAll(async () => {
    await removeTestUser(facebookUsernameTest);
  });
});
