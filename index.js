const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    console.log(`Event: ${github.context.eventName}`);

    if (github.context.eventName === 'pull_request') {
      const pullPayload = github.context.payload;

      const octokit = github.getOctokit(process.env.API_TOKEN);
      const files = await octokit.pulls.listFiles({
        owner: 'jasonjoh',
        repo: 'hello-world-javascript-action',
        pull_number: pullPayload.pull_request.number,
        per_page: 100
      });

      const regex = /\r\n/g;

      var errorFiles = [];

      for (const file of files.data) {
        console.log(`File: ${file.filename}`);

        const response = await fetch(file.raw_url);
        const content = await response.text();

        if (regex.test(content)) {
          errorFiles.push(file);
          console.log('File contains CRLF');
        } else {
          console.log('File is clean');
        }
      }

      var prComment = '### EOL Buster Validation Failed\n\n' +
       'The following files in this pull request have Windows-style line endings:\n\n';

      if (errorFiles.length > 0) {
        errorFiles.forEach(file => {
          prComment = prComment + `- ${file.filename}`;
        });

        octokit.issues.createComment({
          owner: 'jasonjoh',
          repo: 'hello-world-javascript-action',
          issue_number: pullPayload.pull_request.number,
          body: prComment
        });

        octokit.issues.addLabels({
          owner: github.context.owner,
          repo: github.context.repo,
          issue_number: pullPayload.pull_request.number,
          labels: [ 'crlf detected' ]
        });

        core.setFailed('Files with CRLF detected in pull request');
      } else {
        octokit.issues.removeLabel({
          owner: github.context.owner,
          repo: github.context.repo,
          issue_number: pullPayload.pull_request.number,
          name: 'crlf detected'
        });
      }
    }
    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2)
    //console.log(`The event payload: ${payload}`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
