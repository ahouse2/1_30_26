from backend.app.agents.runner import select_team_key


def test_select_team_key_routes_drafting() -> None:
    assert select_team_key("Draft a motion to compel") == "drafting"


def test_select_team_key_routes_deposition() -> None:
    assert select_team_key("Prepare deposition outline for witness") == "deposition"


def test_select_team_key_routes_subpoena() -> None:
    assert select_team_key("Need to issue a subpoena for records") == "subpoena"


def test_select_team_key_routes_discovery() -> None:
    assert select_team_key("Discovery production schedule and requests") == "discovery"


def test_select_team_key_routes_trial_prep() -> None:
    assert select_team_key("Trial prep checklist for upcoming hearing") == "trial_prep"
