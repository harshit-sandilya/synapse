from functions import queue_inference
from utils.state import StateManager

state = StateManager()


def main():
    queue_inference(state.get("experimentId"), 5000)


if __name__ == "__main__":
    main()
