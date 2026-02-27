export interface BloodMarker {
  marker_name: string;
  value: number;
  unit: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  is_within_range: boolean;
}

export interface BloodTest {
  id: string;
  user_id: string;
  test_date: string;
  lab_name: string | null;
  file_url: string | null;
  markers: BloodMarker[];
  created_at: string;
  updated_at: string;
}
