import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from io import BytesIO
from datetime import date
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from weekly_seo_audit import windows, totals, indexed, candidates, ga_rows, render, api, safe_report
class TestAudit(unittest.TestCase):
    def test_windows(self):
        current,previous=windows(date(2026,11,24))
        self.assertEqual(tuple(map(str,current)),("2026-10-25","2026-11-21"))
        self.assertEqual(tuple(map(str,previous)),("2026-09-27","2026-10-24"))
    def test_empty_data(self):
        self.assertEqual(totals({})["clicks"],0)
        self.assertEqual(indexed({}),{})
    def test_small_impressions_excluded(self):
        current={("small",):dict(clicks=0,impressions=15,ctr=0,position=9),
                 ("real",):dict(clicks=0,impressions=100,ctr=0,position=11)}
        self.assertEqual(len(candidates(current,{})),1)
        self.assertEqual(candidates(current,{})[0][0],("real",))
    def test_ga4_event_rows(self):
        response={"dimensionHeaders":[{"name":"eventName"}],"rows":[{"dimensionValues":[{"value":"finder_open"}],"metricValues":[{"value":"4"}]}]}
        self.assertEqual(ga_rows(response)[0]["eventCount"],4)
    def test_http_403_reports_the_failing_google_service_without_leaking_credentials(self):
        payload=b'{"error":{"code":403,"status":"PERMISSION_DENIED"}}'
        for url,label in (
            ("https://www.googleapis.com/webmasters/v3/sites/example/searchAnalytics/query","Search Console"),
            ("https://analyticsdata.googleapis.com/v1beta/properties/123:runReport","GA4 Data API")
        ):
            with self.subTest(service=label):
                error=HTTPError(url,403,"Forbidden",{},BytesIO(payload))
                with patch('weekly_seo_audit.urlopen',side_effect=error):
                    with self.assertRaises(RuntimeError) as context:
                        api(url,{},"DO_NOT_DISPLAY_SECRET_TOKEN")
                self.assertIn(label,str(context.exception))
                self.assertIn("403",str(context.exception))
                self.assertIn("PERMISSION_DENIED",str(context.exception))
                self.assertNotIn("DO_NOT_DISPLAY_SECRET_TOKEN",str(context.exception))
    def test_ga4_403_does_not_hide_search_console_results(self):
        periods=windows(date(2026,11,24))
        site=dict(clicks=3,impressions=100,ctr=.03,position=19)
        output=render(*periods,(site,site),{"クエリ":({}, {})},None,"GA4 Data API HTTP 403（コード: PERMISSION_DENIED）")
        self.assertIn("Search Consoleの集計は取得済み",output)
        self.assertIn("GA4 Data API HTTP 403",output)
        self.assertIn("100",output)
        self.assertNotIn("GA4\\n未設定",output)
    def test_render(self):
        periods=windows(date(2026,11,24))
        zeros=dict(clicks=0,impressions=0,ctr=0,position=0)
        out=render(*periods,(zeros,zeros),{"クエリ":({},{})})
        self.assertIn("2026-11-21",out)
        self.assertIn("読み取り専用",out)
    def test_public_report_hides_metrics_and_queries(self):
        cur,prev=windows(date(2026,11,24))
        metric=dict(clicks=0,impressions=12345,ctr=0,position=9)
        data={"ページ":({("https://minna-hikaku.vercel.app/earphones/",):metric},{}),
              "クエリ":({("PRIVATE_TEST_QUERY",):metric},{})}
        out=safe_report(cur,prev,data,None,None)
        self.assertIn("/earphones/",out)
        self.assertNotIn("12345",out)
        self.assertNotIn("PRIVATE_TEST_QUERY",out)
if __name__=="__main__":unittest.main()
