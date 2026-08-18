---
title: "React with Typescript series (Charity Web App) — Deploying to Github pages"
date: "2022-10-20"
preview: "Hey Guys, In the last tutorial we kind of completed the front end part with a nice form (with saving capabilities)."
description: "Deploying the React and TypeScript charity web app to GitHub Pages for free, before wiring up any backend integration."
tags: ["react", "nodejs", "devops"]
mediumUrl: "https://medium.com/@billacode/react-with-typescript-series-charity-web-app-deploying-to-github-pages-ab86a1888fab"
---
Hey Guys, In the last tutorial we kind of completed the front end part with a nice form (with saving capabilities).

Before integrating backend changes, In this tutorial I will show you how to deploy this react app to Github pages using Github actions. Normally we can create another branch called gh-pages and then add our build code there and get a running UI in Github. But in this tutorial I will give you a fully automated way to do that. But most important thing to remember is to go to your repo and enable Github actions from there. If notIt won’t be visible for you.

I’m not going deep in to what is Github actions or how we can create. Because there are thousands of resources out there you can refer. Here I would give you the action that I implemented and give reasons why we used it that way. First create a file named page_build.yml in a folder named .github/workflows/. Add this code there. (If you go to Github actions in your repo and click on new workflow, this can be created from there too).

```
name: React Build

on:
  pull_request:
    branches: [ "main" ]
    
env:
  CI: false

jobs:
  build:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      contents: 'read'
      id-token: 'write'
      pages: 'write'
      actions: 'write'
      checks: 'write'
      deployments: 'write'
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Build
      run: |
        npm install
        npm run build
        
    - name: Setup Pages
      uses: actions/configure-pages@v2
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v1
      with:
        # Upload build directory content
        path: 'build/'
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v1
      env:  
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

First one is an obvious configuration. This is the name for the action.

```
name: React Build
```

Next we have the trigger. We can define in which occasion this should trigger. In this occasion we have defined it to trigger when a pull request is created on main branch. If you want to trigger it in push. Then you can add something like this as well.

```
on:
 push:
  branches: [ "main" ]  
 pull_request:
  branches: [ "main" ]
```

Next we have the environment variable for the whole action. Here CI is put to false, If not it would treat warnings as errors and build will fail.

```
env:
  CI: false
```

Next we have the set of jobs running in the action. I have put everything in the build job. If you want you can use seperate this out if you want. Under build job, fist config we have is running environment.

```
runs-on: ubuntu-latest
```

Next we have the environment for the Github repo.

```
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

Next we have to add the permissions.

```
permissions:
  contents: 'read'
  id-token: 'write'
  pages: 'write'
  actions: 'write'
  checks: 'write'
  deployments: 'write'
```

Then next most important thing is steps. These first steps checkout Node to run and setup the environment.

```
- uses: actions/checkout@v3

- name: Use Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v3
  with:
    node-version: ${{ matrix.node-version }}
```

Then we build the code

```
- name: Build
  run: |
    npm install
    npm run build
```

In the next set of steps we deploy to the Github pages after copying the build folder content.

```
- name: Setup Pages
  uses: actions/configure-pages@v2
- name: Upload artifact
  uses: actions/upload-pages-artifact@v1
  with:
    # Upload build directory content
    path: 'build/'
- name: Deploy to GitHub Pages
  id: deployment
  uses: actions/deploy-pages@v1
```

At last we have GITHUB_TOKEN env secret. This is a must.

```
env:  
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This is all what we need. Now for my repo following is the URL this will be deployed to.

But if you go to this URL now. you will get an 404 error. The reason is we haven’t defined the homepage URL correctly for the React app. It will consider the first part of the URL as the href base root. To fix this we have to change the package.json file. New one should look like this.

```json
{
  "name": "serendib-ui",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://debilla.github.io/serendib-scholarship-ui",
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.1.1",
    "@testing-library/user-event": "^13.5.0",
    "@types/jest": "^27.4.1",
    "@types/node": "^16.11.31",
    "@types/react": "^18.0.8",
    "@types/react-dom": "^18.0.0",
    "bootstrap": "^5.1.3",
    "react": "^18.1.0",
    "react-bootstrap": "^2.3.1",
    "react-data-grid": "7.0.0-beta.15",
    "react-dom": "^18.1.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.6.3",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

Now if you create a PR to main branch, action will be triggered and you will see the deployed UI app in Github pages. Happy coding guys :P. Next time we will meet with a way to create the backend for this app.
