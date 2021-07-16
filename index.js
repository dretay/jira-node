const _ = require("underscore");
const JiraApi = require("jira-client");
const prompts = require("prompts");
const ini = require("ini");
const fs = require("fs");
const moment = require("moment");
const { Issue } = require("./issue");

class Jira {
  constructor({ configIni = null, jiraServer = null } = {}) {
    if (configIni !== null) {
      let config = ini.parse(fs.readFileSync("./config.ini", "utf-8"));
      this.jiraServer = config[configIni].uri;
      this.jiraProject = config[configIni].project;
      this.epicLinkField = config[configIni].epicLinkField;
      this.epicNameField = config[configIni].epicNameField;
      this.dependencyType = config[configIni].dependencyType;
      this.highlightsQuery = config[configIni].highlightsQuery;
      this.lowlightsQuery = config[configIni].lowlightsQuery;
      this.activeEpics = config[configIni].activeEpics;
    } else if (jiraServer !== null) {
      this.jiraServer = jiraServer;
    } else {
      throw "must either define an ini file to parse or define the jira server";
    }
    this.jiraConnection = null;
  }

  async connect({ username, password } = {}) {
    this.jiraConnection = new JiraApi({
      protocol: "https",
      host: this.jiraServer,
      username: username,
      password: password,
      apiVersion: "2",
      strictSSL: false,
    });
  }

  async getIssues(jql) {
    console.log(`executing jql: ${jql}`);
    let mappedIssues = [];

    let { issues } = await this.jiraConnection.searchJira(`${jql}`, { expand: ["changelog"] });
    return _.map(issues, (rawIssue) => {
      return new Issue(this, rawIssue);
    });
  }
  async getProjectInfo() {
    let project = await this.jiraConnection.getProject(`${this.jiraProject}`);
    let linkTypes = await this.jiraConnection.listIssueLinkTypes();

    let issueTypes = {};
    _.map(project.issueTypes, (issueType) => {
      issueTypes[issueType.name] = issueType.id;
    });
    return {
      id: project.id,
      issueTypes: issueTypes,
      name: project.name,
      linkTypes: linkTypes,
    };
  }
  async addNewIssue(project, summary, issueType, points, description, component, epic = null) {
    let issue = {
      fields: {
        project: {
          id: project,
        },
        customfield_10002: points,
        summary: summary,
        issuetype: {
          id: issueType,
        },
        description: description,
        components: [{ name: component }],
      },
    };
    if (epic !== null) {
      console.log(`Setting epic key to ${epic}`);
      issue.fields[this.epicLinkField] = epic;
    }
    return await this.jiraConnection.addNewIssue(issue);
  }
  async addNewEpic(project, summary, issueType, description, component) {
    let issue = {
      fields: {
        project: {
          id: project,
        },
        summary: summary,
        issuetype: {
          id: issueType,
        },
        description: description,
        // components: [{ name: component }],
      },
    };
    issue.fields[this.epicNameField] = summary;
    console.log(JSON.stringify(issue));

    return await this.jiraConnection.addNewIssue(issue);
  }
}
exports.Jira = Jira;
