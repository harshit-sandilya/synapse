from pprint import pprint

SEPARATOR = "=" * 100


def print_request(
    method: str,
    url: str,
    *,
    headers=None,
    params=None,
    payload=None,
):
    print("\n" + SEPARATOR)
    print(f"REQUEST  [{method.upper()}]")
    print(SEPARATOR)

    print(f"URL: {url}")

    if params:
        print("\nQuery Params:")
        pprint(params)

    if headers:
        print("\nHeaders:")
        pprint(headers)

    if payload is not None:
        print("\nPayload:")
        pprint(payload)

    print(SEPARATOR)


def print_response(response):
    print("\n" + SEPARATOR)
    print("RESPONSE")
    print(SEPARATOR)

    print(f"Status: {response.status_code} " f"{response.reason}")

    print("\nHeaders:")
    pprint(dict(response.headers))

    try:
        body = response.json()

        print("\nBody:")
        pprint(body)

    except Exception:
        body = None

        print("\nBody:")
        print(response.text)

    print(SEPARATOR)

    return body
