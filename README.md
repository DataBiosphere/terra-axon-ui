# Axon UI

Axon is a user interface for the MC Terra platform. It communicates primarily
with the Workspace Manager and SAM to allocate workspaces and manage
permissions on cloud resources.

## Setup

You must set the `REACT_APP_CLIENT_ID` environment variable to a valid OAuth2 client ID.

`export REACT_APP_CLIENT_ID=<value>`

### Dependencies

This project requires the latest version of Node 16 and
[JDK](https://www.oracle.com/java/technologies/downloads/ #jdk18-mac).

On a Mac, use:

`brew install node`

### Installation

To install the node depdencies for the app, run:

`npm install`

### Running

To service the app in development mode run:

`npm start`

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

By default, the backend for the `devel` environment specified in
`configuration.json` will be used. To use a local fake instead, run:

`npm start:fake`

Running against a fake can be useful to manually operate in the same environment as the tests, or
for development iteration where the fake APIs are much faster.

### Unit tests

To launch the unit test runner (Jest), run:

`npm test`

This launches in interactive watch.
See the section about
[running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### End-to-end tests

There are a number of supported configurations for end-to-end tests. We can run against a local
web server, or against a live version of the UI. We can also run against a local fake backends, or
against live backends.

#### Local UI, fake backends

This is the configuration that will run on presubmit.

To start the local web server, start the local fake, and launch Cypress:

`npm run test:e2e`

This will run all the tests on the command line

`npm run test:e2e:dev`

This will launch the interactive developer UI.

#### Live UI, live backends

When running against a live UI, the test user specified in `configuration.json`
is used. To ensure that you can act as the account, you must authorize your
Google Cloud application default credentials (only once):

`gcloud auth application-default login`.

For example, to run against a live UI hosted at `terra.example.com`, run:

`CYPRESS_BASE_URL=https://terra.example.com npm run cy:run`

To use the interactive Cypress UI instead, run `cy:dev` instead of `cy:run`.

### Local UI already running

This configuration can be used for iterative development of the local UI against live backends. It assumes you've already started the UI using:

`npm run start`

Then launch Cypress directly:

`npm run cy:run`

Or in interactive mode:

`npm run cy:dev`

If you started your local environment using a local fake (`npm run start:Fake`), set the `CYPRESS_USE_FAKE=1` environment
variable.

### Formatting

Formats the app with [Prettier](https://prettier.io/):

`npm run format`

Runs CI formatting validations with [Prettier](https://prettier.io/):
`npm run format:ci`

### Deploy

To builds the app for production to the `build` folder:

`npm run build`

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for
more information.
