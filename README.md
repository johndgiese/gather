# Gather Games Word Associations

A simple group-based word game designed to be played on phones and tablets
while at the same location.


## Installation

## Install Dependencies

You will need to install `mysql` and `node` first.

```bash
npm install -g grunt-cli bower
bower install
npm install
```

## Setup Database and static files

```bash
cp server/local.template.js server/_local.js
vim server/_local.js  # fill in details
grunt setup
```

## Run Server

Starting from the root of the repository:

```bash
node server/index.js
```

## Development

Run server tests:

```bash
grunt tests
```

Setup watch for static or server tests or client tests:

```bash
grunt watch:tests
# or
grunt watch:static
# or 
grunt karma
```

I don't know how to only run client tests without the watch server.
