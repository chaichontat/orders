from functools import wraps
from typing import Callable, ParamSpec, cast

import requests


def check_resp(resp: requests.Response):
    print(resp.status_code)
    if resp.status_code // 100 != 2:
        raise Exception(resp.json())
    return resp


P = ParamSpec("P")


def check_dupe(checker: Callable[[str | int], list[dict[str, str | int]]]):
    def run_check(f: Callable[P, int]) -> Callable[P, int]:
        @wraps(f)
        def inner(*args: P.args, **kwargs: P.kwargs) -> int:
            if len(args) == 0:
                id_ = kwargs["db_id"]
                name = kwargs["name"]
            elif len(args) == 1:
                (id_,) = args
                name = kwargs["name"]
            else:
                id_, name, *_ = args

            curr = checker(id_)  # type: ignore
            for field in curr:
                if field["name"] == name:
                    return cast(int, field["id"])
            return f(*args, **kwargs)

        return inner

    return run_check


def list_rows(url: str, headers: dict[str, str], table_id: str | int):
    def get_page(page: int):
        return requests.get(
            url
            + f"/database/rows/table/{table_id}/?user_field_names=True&size=200&{page=}",
            headers=headers,
        ).json()

    i = 1
    out = []
    while True:
        res = get_page(i)
        out.extend(res["results"])
        if res["next"] is None:
            break
        i += 1

    return out
