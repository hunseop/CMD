from setuptools import setup, find_packages

setup(
    name="cmd",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "flask",
        "flask-sqlalchemy",
        "pandas",
        "openpyxl",
    ],
) 