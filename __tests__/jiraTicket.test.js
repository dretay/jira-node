const { Jira } = require("../index.js");
describe("jiraTicket", () => {
  describe("simpleTests", () => {
    test("constructor with expected args", () => {
      let jira = new Jira({ jiraServer: "testServer" });
    });
    test("constructor with missing args", () => {
      try {
        let jira = new Jira();
      } catch (e) {
        expect(e).toEqual(expect.stringContaining("must either define an ini file to parse or define the jira server"));
      }
    });
  });
});
