import httpx

client = httpx.Client(trust_env=False)

# Test 1: GreenCross pending login must fail with 403
r1 = client.post('http://127.0.0.1:8001/api/auth/login', json={
    'email': 'greencross@smartcare.org',
    'password': 'hospitalpass123',
    'expected_role': 'HOSPITAL'
})
print("Test 1 - Pending hospital login status:", r1.status_code)
print("Test 1 - Detail message:", r1.json().get('detail'))
assert r1.status_code == 403, f"Expected 403, got {r1.status_code}"

# Test 2: Admin logs in
r_admin = client.post('http://127.0.0.1:8001/api/auth/login', json={
    'email': 'admin@smartcare.org',
    'password': 'adminpassword123',
    'expected_role': 'ADMIN'
})
print("Test 2 - Admin login status:", r_admin.status_code)
admin_token = r_admin.json()['access_token']

# Test 3: Admin inspects applications and approves GreenCross
apps = client.get('http://127.0.0.1:8001/api/admin/applications', headers={
    'Authorization': f'Bearer {admin_token}'
}).json()
greencross_app = next(a for a in apps if a['email'] == 'greencross@smartcare.org')
print(f"Test 3 - Found GreenCross ID: {greencross_app['id']}, docs length: {len(greencross_app.get('documents', ''))}")

r_approve = client.post(
    f"http://127.0.0.1:8001/api/admin/applications/{greencross_app['id']}/verify",
    headers={'Authorization': f'Bearer {admin_token}'},
    json={'action': 'APPROVE', 'notes': 'All establishment licenses inspected and authenticated'}
)
print("Test 3 - Approval status:", r_approve.status_code, "New status:", r_approve.json().get('verification_status'))
assert r_approve.json().get('verification_status') == 'APPROVED'

# Test 4: GreenCross logs in again (must now succeed with 200!)
r2 = client.post('http://127.0.0.1:8001/api/auth/login', json={
    'email': 'greencross@smartcare.org',
    'password': 'hospitalpass123',
    'expected_role': 'HOSPITAL'
})
print("Test 4 - GreenCross login after approval:", r2.status_code)
print("Test 4 - Hospital:", r2.json().get('hospital_name'), "Status:", r2.json().get('verification_status'))
assert r2.status_code == 200
print("\nALL VERIFICATION & SECURITY GATE TESTS PASSED!")
