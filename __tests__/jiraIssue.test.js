const { Issue } = require("../issue.js");
const simpleJiraHistory = require("./mockData/jira_history_simple.json");
describe("jiraIssue", () => {
  describe("simpleTests", () => {
    test("constructor with expected args", () => {
      let issue = new Issue({ id: null, key: null, fields: null, changelog: null });
    });
    test("parseHistories", () => {
      let issue = new Issue({ id: null, key: null, fields: null, changelog: null });
      issue.parseHistories(simpleJiraHistory);
    });
    // test("constructor with missing args", () => {
    //   try {
    //     let jira = new Jira();
    //   } catch (e) {
    //     expect(e).toEqual(expect.stringContaining("must either define an ini file to parse or define the jira server and project"));
    //   }
    // });
  });
});
