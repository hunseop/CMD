import pandas as pd

# 샘플 데이터 생성
data = {
    'name': [
        'Firewall-Main',
        'Switch-Core',
        'Router-Edge',
        'IPS-Internal',
        'WAF-External'
    ],
    'category': [
        'firewall',
        'switch',
        'router',
        'ips',
        'waf'
    ],
    'manufacturer': [
        'Palo Alto',
        'Cisco',
        'Juniper',
        'Fortinet',
        'F5'
    ],
    'model': [
        'PA-5250',
        'Nexus 9300',
        'MX240',
        'FortiGate 600E',
        'BIG-IP i4800'
    ],
    'version': [
        '10.1.0',
        '9.3(8)',
        '21.4R1',
        '7.0.3',
        '16.1.2'
    ],
    'ip_address': [
        '192.168.1.1',
        '192.168.1.10',
        '192.168.1.20',
        '192.168.1.30',
        '192.168.1.40'
    ],
    'port': [
        443,
        22,
        22,
        8443,
        443
    ],
    'username': [
        'admin',
        'admin',
        'admin',
        'admin',
        'admin'
    ],
    'password': [
        'PaloAlto@2024',
        'Cisco@2024',
        'Juniper@2024',
        'Fortinet@2024',
        'F5@2024'
    ]
}

# DataFrame 생성
df = pd.DataFrame(data)

# 엑셀 파일로 저장
output_file = 'sample_devices.xlsx'
df.to_excel(output_file, index=False)

print(f"샘플 엑셀 파일이 생성되었습니다: {output_file}") 