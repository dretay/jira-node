const _ = require("underscore");
const JiraApi = require("jira-client");
const prompts = require("prompts");
const ini = require("ini");
const fs = require("fs");
const moment = require("moment-business-days");

class Issue {
  constructor(jira, { id, key, fields, changelog } = {}) {
    this.jira = jira;
    this.key = key;
    this.startDate = moment();
    this.endDate = null;
    if (_.has(changelog, "histories")) {
      this.hoursWorked = this.parseHoursWorked(changelog.histories);
    }
    this.parseFields(fields);
    this.getDependencies(fields);
  }
  getDependencies({ issuelinks } = {}) {
    this.dependencies = _.compact(
      _.map(issuelinks, (issuelink) => {
        if (_.has(issuelink, "inwardIssue")) {
          return issuelink.inwardIssue.key;
        }
        return null;
      })
    );
  }
  async getChildren() {
    if (!_.has(this, "children")) {
      this.children = await this.jira.getIssues(`"Epic Link" = ${this.key}`);
    }
    return this.children;
  }
  parseFields(fields) {
    this.summary = fields.summary.replace(/[^a-zA-Z0-9\s]/g, "");
    this.issueType = fields.issuetype.name;
    this.duedate = fields.duedate;
    this.project = fields.project.name;
    this.resolution = _.get(fields.resolution, "name", "In Progress");
    this.storyPoints = fields.customfield_10006;
    if (!_.isNumber(this.storyPoints) && !_.isNull(this.storyPoints)) {
      this.storyPoints = fields.customfield_10002;
      this.epicKey = fields.customfield_10006;
    } else {
      this.epicKey = fields.customfield_10002;
    }
    this.assignee = _.get(fields.assignee, "emailAddress");
    this.assigneeName = _.get(fields.assignee, "displayName");
    this.status = fields.status.name;
    this.labels = fields.labels;
  }
  parseHoursWorked(histories) {
    let startStatuses = ["In Progress"];
    let stopStatuses = ["Dev Complete"];

    //only look at history items involving state transitions
    let historyItems = _.filter(histories, (history) => {
      let toStrings = _.pluck(history.items, "toString");
      let ticketStatuses = startStatuses.concat(stopStatuses);
      return _.intersection(toStrings, ticketStatuses).length > 0 ? true : false;
    });

    //sort by when item was created
    historyItems = _.sortBy(historyItems, (history) => {
      moment(history.created).valueOf();
    });

    //the first startStatuses is the start date
    for (let historyItem of historyItems) {
      let toStrings = _.pluck(historyItem.items, "toString");
      if (_.intersection(toStrings, startStatuses).length > 0) {
        this.startDate = moment(historyItem.created);
        break;
      }
    }
    //the last stopStatuses is the start date
    for (let historyItem of historyItems) {
      let toStrings = _.pluck(historyItem.items, "toString");
      if (_.intersection(toStrings, stopStatuses).length > 0) {
        this.endDate = moment(historyItem.created);
        break;
      }
    }
    let lastItem = null;
    let totalHours = 0;
    //add up the deltas for each transition
    for (let historyItem of historyItems) {
      let toStrings = _.pluck(historyItem.items, "toString");
      if (lastItem === null) {
        lastItem = historyItem;
      }
      //it only counts if we're transitioning to a stop status
      else if (_.intersection(toStrings, stopStatuses).length > 0) {
        let businessDays = moment(historyItem.created).businessDiff(moment(lastItem.created));
        if (businessDays === 0) {
          totalHours += moment(historyItem.created).diff(moment(lastItem.created), "hours");
        } else {
          totalHours += businessDays * 8;
        }
      }
      lastItem = historyItem;
    }
    return totalHours;
  }
}
exports.Issue = Issue;
