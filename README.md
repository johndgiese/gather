# Gather Games Word Associations

A simple group-based word game designed to be played on phones and tablets
while at the same location.

Checkout the site online at: https://gather.gg

The code is organized into three main folders.

1. `server` - a django based server (serving non-game files)
2. `static` - all the static files for the game (which is a single page application)
3. `realtime_server` - a nodejs server for the realtime game API

## Installation

## Install Dependencies

You will need to install `mysql`, `node`, `python`, `pip`, and `virtualenv` first.

```bash
npm install -g grunt-cli bower
bower install
npm install
virtualenv env
pip install -r requirements.txt
```

## Setup Database and static files

```bash
cp local.template.json server/_local.json
vim _local.json  # fill in details
grunt setup
```

## Run Test Server

```bash
# start node real time server
node node/index.js

# in a separate terminal/tmux pane
virtualenv env/bin/activate  # enter virtual environment
cd django
python manage.py runserver  # start the python test server
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

## Run Production Server

1. run manage.py collectstatic
2. enable apache modwsgi and rewrite
3. sym link apache config and enable
