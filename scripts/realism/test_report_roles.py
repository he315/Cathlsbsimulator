"""
Device and live-path runs stay outside the pass count (realism-baseline). No captures needed.

  python3 -I -m unittest discover -s scripts/realism -p 'test_report_roles.py'

Checks _role on old and new capture metadata, that partition_runs keeps role-less runs as scorecard runs
and moves device and live runs out, and that every measurement row has pass None, in_band from the
compared row, and its twin from _twin.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import report  # noqa: E402


class RoleTest(unittest.TestCase):
    def test_role_from_metadata(self):
        self.assertEqual(report._role({"spec": {}}), "scorecard")
        self.assertEqual(report._role(None), "scorecard")
        self.assertEqual(report._role({"spec": {"source": "offscreen"}}), "scorecard")
        self.assertEqual(report._role({"spec": {"source": "pci-hook"}}), "live")
        self.assertEqual(report._role({"spec": {"source": "fluoro-hook"}}), "live")
        self.assertEqual(report._role({"spec": {"devices": "wire"}}), "device")
        self.assertEqual(report._role({"spec": {"devices": None}}), "scorecard")
        # spec.role wins over what the source or devices would imply
        self.assertEqual(report._role({"spec": {"role": "scorecard", "source": "pci-hook", "devices": "wire"}}), "scorecard")
        self.assertEqual(report._role({"spec": {"role": "device"}}), "device")

    def test_partition(self):
        runs = [
            {"run": "a"},
            {"run": "b", "role": "scorecard"},
            {"run": "c", "role": "device"},
            {"run": "d", "role": "live"},
        ]
        score, meas = report.partition_runs(runs)
        self.assertEqual([r["run"] for r in score], ["a", "b"])
        self.assertEqual([r["run"] for r in meas], ["c", "d"])
        # a set without roles gives exactly the runs it had
        plain = [{"run": "x"}, {"run": "y"}]
        self.assertEqual(report.partition_runs(plain), (plain, []))


class MeasurementRowsTest(unittest.TestCase):
    def setUp(self):
        self._compare = report.compare
        self.calls = []

        def fake_compare(doc, runs, profile, pipeline):
            self.calls.append([r["run"] for r in runs])
            v = 2.0 if runs[0]["run"].startswith("tw") else 1.0
            return [
                {"metric": "m", "artery": "any", "view": "any", "value": v, "pass": True, "indicative": False, "target": None},
                {"metric": "n", "artery": "any", "view": "any", "value": v, "pass": False, "indicative": True, "target": None},
                {"metric": "z", "artery": "any", "view": "any", "value": None, "pass": None, "indicative": False, "target": None},
            ]

        report.compare = fake_compare

    def tearDown(self):
        report.compare = self._compare

    def test_rows_never_pass(self):
        runs = [{"run": "tw1", "mode": "cine", "artery": "LAD", "family": "rao-caudal", "angles": (-30, -25)}]
        mruns = [
            {"run": "dev1", "role": "device", "mode": "cine", "artery": "LAD", "family": "rao-caudal", "angles": (-30, -25)},
            {"run": "live1", "role": "live", "mode": "cine", "artery": "RCA", "family": "lao", "angles": (30, 0)},
        ]
        out = report.measurement_rows({}, mruns, runs, "cd-ds", "matched")
        self.assertEqual(len(out), 4)  # the None-valued row is dropped
        for r in out:
            self.assertIsNone(r["pass"])
            self.assertFalse(r["indicative"])
            self.assertTrue(r["measurement"])
        dev = [r for r in out if r["run"] == "dev1"]
        self.assertEqual([r["in_band"] for r in dev], [True, False])
        self.assertTrue(all(r["twin"] == report._twin(mruns[0], runs)["run"] == "tw1" for r in dev))
        self.assertTrue(all(r["twin_value"] == 2.0 and r["role"] == "device" for r in dev))
        live = [r for r in out if r["run"] == "live1"]
        self.assertIsNone(report._twin(mruns[1], runs))
        self.assertTrue(all(r["twin"] is None and r["twin_value"] is None for r in live))
        # each run, and the twin once, is compared alone; the scorecard runs never meet the measurement runs
        self.assertTrue(all(len(c) == 1 for c in self.calls))


if __name__ == "__main__":
    unittest.main()
