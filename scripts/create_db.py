#%%
from concurrent.futures import ThreadPoolExecutor

import requests
from utils import check_dupe, check_resp, list_rows

url = "https://baserow.gofflab.org"
group_id = 84
username = "chaichontat.s@gmail.com"
password = "relic-formosan-helm-riel-WORKABLE"
timezone = "America/New_York"


url += "/api"


def get_jwt(username: str, password: str):
    return requests.post(
        url + "/user/token-auth/", data={"username": username, "password": password}
    ).json()["token"]


jwt = get_jwt(username, password)
headers = {"Authorization": f"JWT {jwt}"}


#%%
def list_dbs(group_id: int | str) -> list[dict[str, str | int]]:
    return requests.get(
        url + f"/applications/group/{group_id}/", headers=headers
    ).json()


@check_dupe(list_dbs)
def create_db(group_id: int, name: str):
    resp = check_resp(
        requests.post(
            f"{url}/applications/group/{group_id}/",
            headers=headers,
            data={"name": name, "type": "database", "init_with_data": False},
        )
    )
    return resp.json()["id"]


db_id = create_db(group_id, "Lab Orders")
#%% Create tables


def list_tables(db_id: str | int) -> list[dict[str, str | int]]:
    resp = check_resp(
        requests.get(f"{url}/database/tables/database/{db_id}/", headers=headers)
    )
    return resp.json()


@check_dupe(list_tables)
def create_table(db_id: str | int, name: str):
    resp = check_resp(
        requests.post(
            f"{url}/database/tables/database/{db_id}/",
            headers=headers,
            data={"name": name},
        )
    )
    return resp.json()["id"]


newTables = {
    "vendors": create_table(db_id, "Vendors"),
    "items": create_table(db_id, "Items"),
    "grants": create_table(db_id, "Grants"),
    "orders": create_table(db_id, "Orders"),
}


# %%


def list_fields(table_id: str | int):
    return requests.get(
        url + f"/database/fields/table/{table_id}/?user_field_names=True",
        headers=headers,
    ).json()


check_dupe_field = check_dupe(list_fields)


@check_dupe(list_fields)
def post_field(table_id: str | int, name: str, *, type: str, **kwargs):
    resp = check_resp(
        requests.post(
            f"{url}/database/fields/table/{table_id}/",
            headers=headers,
            data={"name": name, "type": type, **kwargs},
        )
    )

    return resp.json()["id"]


fields_id = {
    "vendors": dict(
        Supplier=post_field(newTables["vendors"], "Supplier", type="boolean")
    ),
    "items": {},
    "grants": {},
    "orders": {},
}

# %%
item_fields = [
    {"name": "Cat #", "type": "text"},
    {"name": "Unit", "type": "text"},
    {
        "name": "Vendor",
        "type": "link_row",
        "link_row_table_id": newTables["vendors"],
        "has_related_field": True,
    },
    {"name": "Link", "type": "url"},
    {"name": "Type", "type": "single_select", "select_options": []},
    {"name": "Project", "type": "multiple_select", "select_options": []},
    {
        "name": "Created",
        "type": "created_on",
        "date_format": "ISO",
        "date_include_time": True,
        "date_time_format": "24",
        "timezone": timezone,
    },
    {
        "name": "Modified",
        "type": "last_modified",
        "date_format": "ISO",
        "date_include_time": True,
        "date_time_format": "24",
        "timezone": timezone,
    },
]

fields_id["items"] = {
    f["name"]: post_field(newTables["items"], **f) for f in item_fields
}
# %%
order_fields = [
    {
        "name": "Unit Price",
        "type": "number",
        "number_decimal_places": 2,
        "number_negative": False,
    },
    {"name": "Confirmation", "type": "text", "text_default": ""},
    {"name": "Unit", "type": "text", "text_default": ""},
    {
        "name": "Quantity",
        "type": "number",
        "number_decimal_places": 0,
        "number_negative": False,
    },
    {
        "name": "Created",
        "type": "created_on",
        "date_format": "ISO",
        "date_include_time": False,
        "date_time_format": "24",
        "timezone": timezone,
    },
    {
        "name": "Date Created",
        "type": "last_modified",
        "date_format": "ISO",
        "date_include_time": True,
        "date_time_format": "24",
        "timezone": timezone,
    },
    {
        "name": "Date Ordered",
        "type": "date",
        "date_format": "ISO",
        "date_include_time": False,
        "date_time_format": "24",
        "timezone": timezone,
    },
    {
        "name": "Date Received",
        "type": "date",
        "date_format": "ISO",
        "date_include_time": False,
        "date_time_format": "24",
        "timezone": timezone,
    },
    {
        "name": "Item",
        "type": "link_row",
        "has_related_field": True,
        "link_row_table_id": newTables["items"],
    },
    {
        "name": "Price",
        "type": "formula",
        "number_decimal_places": 2,
        "formula": "field('Unit Price') * field('Quantity')",
        "formula_type": "number",
    },
    {
        "name": "Requestor",
        "type": "single_select",
        "select_options": [],
    },
    {
        "name": "Grant",
        "type": "link_row",
        "has_related_field": True,
        "link_row_table_id": newTables["grants"],
    },
    {"name": "Supplier Cat", "type": "text", "text_default": ""},
    {
        "name": "Supplier",
        "type": "link_row",
        "has_related_field": True,
        "link_row_table_id": newTables["vendors"],
    },
    {"name": "Received By", "type": "text", "text_default": ""},
    {"name": "Location", "type": "text", "text_default": ""},
]
fields_id["orders"] = {
    f["name"]: post_field(newTables["orders"], **f) for f in order_fields
}

lookup_items = [
    {
        "name": "Cat #",
        "type": "lookup",
        "through_field_id": fields_id["orders"]["Item"],
        "target_field_id": fields_id["items"]["Cat #"],
    },
    {
        "name": "Link",
        "type": "lookup",
        "through_field_id": fields_id["orders"]["Item"],
        "target_field_id": fields_id["items"]["Link"],
    },
    {
        "name": "Vendor",
        "type": "lookup",
        "through_field_id": fields_id["orders"]["Item"],
        "target_field_id": fields_id["items"]["Vendor"],
    },
]

fields_id["orders"] = {
    f["name"]: post_field(newTables["orders"], **f) for f in lookup_items
} | fields_id["orders"]

# %% Remove blank rows


def delete(table_id: str | int, row_id: str | int):
    return check_resp(
        requests.delete(
            url + f"/database/rows/table/{table_id}/{row_id}/", headers=headers
        )
    )


def delete_all(table_id: str | int):
    rows = list_rows(url, headers, table_id)
    with ThreadPoolExecutor(max_workers=8) as exc:
        exc.map(lambda x: delete(table_id, x["id"]), rows)


for value in newTables.values():
    delete_all(value)


#%% Views
def list_views(table_id: str | int):
    return check_resp(
        requests.get(url + f"/database/views/table/{table_id}/", headers=headers)
    ).json()


@check_dupe(list_views)
def post_view(table_id: str | int, name: str):
    return check_resp(
        requests.post(
            url + f"/database/views/table/{table_id}/",
            headers=headers,
            data={"name": name, "type": "grid"},
        )
    ).json()["id"]


def gen_view(
    table_id: str | int,
    name: str,
    filters: list[dict[str, str | int]] = [],
    sortings: dict[str, str | int] = {},
):
    view_id = post_view(table_id, name)
    for f in filters:
        check_resp(
            requests.post(
                url + f"/database/views/{view_id}/filters/",
                headers=headers,
                data=f,
            )
        )
    check_resp(
        requests.post(
            url + f"/database/views/{view_id}/sortings/", headers=headers, data=sortings
        )
    )
    return view_id


views = {}

views["requested"] = gen_view(
    newTables["orders"],
    "Requested",
    filters=[
        {
            "field": fields_id["orders"]["Date Ordered"],
            "type": "empty",
            "value": "",
        }
    ],
    sortings={
        "field": fields_id["orders"]["Created"],
        "order": "DESC",
        "value": "DESC",
    },
)
views["received"] = gen_view(
    newTables["orders"],
    "Received",
    filters=[
        {
            "field": fields_id["orders"]["Date Received"],
            "type": "not_empty",
            "value": "",
        }
    ],
    sortings={
        "field": fields_id["orders"]["Date Received"],
        "order": "DESC",
        "value": "DESC",
    },
)
views["ordered"] = gen_view(
    newTables["orders"],
    "Ordered",
    filters=[
        {
            "field": fields_id["orders"]["Date Ordered"],
            "type": "not_empty",
            "value": "",
        },
        {
            "field": fields_id["orders"]["Date Received"],
            "type": "empty",
            "value": "",
        },
    ],
    sortings={
        "field": fields_id["orders"]["Date Ordered"],
        "order": "DESC",
        "value": "DESC",
    },
)


# %%
print("NODE_VERSION=16")
print(f"PUBLIC_BASEROW_URL={url if not url.endswith('api') else url[:-4]}")
for k, v in newTables.items():
    print(f"PUBLIC_{k.upper()}_TABLE={v}")

# %%
