// const jiraUser = require("../__tests__/mockData/jira_user.json")
const RealJiraApi = require("jira-client");

class JiraApi {
  constructor(config) {
    this._jira = new RealJiraApi(config);
    // this.getUser = jest.fn().mockResolvedValue(jiraUser)
  }
}
