# JIRA NodeJS

> A NodeJS project that abstracts interfacing with JIRA.

Some simple wrapper functions to make interfacing with JIRA easier.

### How to run tests  ###
```shell
$ npm install
$ npm run test
```
### Instructions ###
#### Example

```shell
(async () => {
  let jira = new Jira({ jiraServer: server });
  await jira.connect({ username: account, password: password });
  let issue = await jira.getIssues(`key=MyTicket-1234`);
  console.dir(issue);
})();
 ```

