import requests

from utils.printer import (
    print_request,
    print_response,
)

BASE_URL = "http://localhost:8080"

session = requests.Session()


def post(path: str, payload=None, unwrap=True):
    url = f"{BASE_URL}{path}"
    print_request(method="POST", url=url, payload=payload)
    response = session.post(url, json=payload)
    body = print_response(response)
    if unwrap and "data" in body:
        return body["data"]
    return body


def get(path: str, params=None, unwrap=True):
    url = f"{BASE_URL}{path}"
    print_request(method="GET", url=url, params=params)
    response = session.get(url, params=params)
    body = print_response(response)
    if unwrap and "data" in body:
        return body["data"]
    return body
