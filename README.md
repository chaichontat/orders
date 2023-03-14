# Orders

A simple laboratory inventory system.

## Setup

### Start a baserow instance

We use our [`docker-compose`](./docker-compose.yml) file based on the [official guide](https://baserow.io/docs/installation%2Finstall-with-docker) to run an instance of Baserow in a small virtual machine.

**The virtual machine must [accept](https://aws.amazon.com/premiumsupport/knowledge-center/connect-http-https-ec2/) incoming connections from ports 80 and 443.**

**You need to change some of the settings to fit your needs.**

- All the keys that start with `**` must be changed.
- Baserow uses email to send username/passwords and a working email account is needed.

  We use Gmail with SMTP [enabled](https://support.google.com/mail/answer/7126229?hl=en#zippy=%2Cstep-check-that-imap-is-turned-on).

- `DATABASE_PASSWORD` can be anything so long as it matches the `POSTGRES_PASSWORD` field below.
- We split the PostgreSQL backend and Baserow in order to allow for direct SQL query through port 5432.

After editing [`docker-compose`](./docker-compose.yml), you can start Docker using

```sh
docker compose up -d
```

### Create a group in Baserow

Once you have Baserow setup, create a [group](https://baserow.io/user-docs/setting-up-a-group). Then, click on `Members` on the left sidebar under your newly created group. Look at your current URL, it should be something like

```
https://[YOUR BASEROW URL]/settings/85/members
```

In this case, `85` is your group id. We will use this later.

Afterwards, check out our table generation [script](./scripts/create_db.py).

https://github.com/chaichontat/orders/blob/f917e09906dcc1cf7868341256dc25f4a474a01d/scripts/create_db.py#L7-L11

Replace each value with yours and run the script. The only dependency is `requests`.

At the end of the script, the script will print out the following:

```
NODE_VERSION=16
PUBLIC_BASEROW_URL=[YOUR BASEROW URL]
PUBLIC_VENDORS_TABLE=460
PUBLIC_ITEMS_TABLE=461
PUBLIC_GRANTS_TABLE=462
PUBLIC_ORDERS_TABLE=463
```

These are the environmental variables for your deployment.

### Deploy

Fork this repo in order to use your static hosting service of choice. We use Cloudflare Pages to deploy our statically generated frontend. The free tier is more than enough.

Check out their [guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site/#deploy-with-cloudflare-pages) on how to deploy a GitHub repo with a SvelteKit project.

In the environment variables section, use the values that were output from the script.

If all goes well, you'll have a working ordering system!
