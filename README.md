# Gather Games Word Associations

A simple group-based word game designed to be played on phones and tables while
at the same location.


## Installation

## Install Dependencies

You will need to install `mysql` and `node` first.

```bash
npm install -g grunt-cli bower
bower install
npm install
```

## Setup Database

Currently assuming there is a username/password matching those in `server/db.js`.

First create a database named "gather".  Then create the database:

```bash
mysql -uroot -p gather < server/schema.sql
```


## Run Server

Starting from the root of the repository:

```bash
node server/index.js
```

