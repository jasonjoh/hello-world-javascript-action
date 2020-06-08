const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    console.log(`Event: ${github.context.eventName}`);

    if (github.context.eventName === 'pull_request') {
      const pullPayload = github.context.payload;

      const octokit = github.getOctokit(secrets.PERSONAL_ACCESS_TOKEN);
      const files = await octokit.pulls.listFiles({
        owner: 'jasonjoh',
        repo: 'hello-world-javascript-action',
        pull_number: pullPayload.pull_request.number,
        per_page: 100
      });

      files.data.forEach((file) => {
        console.log(`File: ${file.filename}`);
      });
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
