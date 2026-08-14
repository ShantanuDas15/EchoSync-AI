import argparse
import datetime
from dateutil.relativedelta import relativedelta

def generate_partition_statements(base_table: str, target_date: datetime.date) -> list[str]:
    start_date = target_date.replace(day=1)
    end_date = start_date + relativedelta(months=1)
    partition_name = f"{base_table}_{start_date.strftime('%Y_%m')}"
    
    statements = [
        f"CREATE TABLE IF NOT EXISTS {partition_name} PARTITION OF {base_table} "
        f"FOR VALUES FROM ('{start_date.strftime('%Y-%m-%d')}') TO ('{end_date.strftime('%Y-%m-%d')}');"
    ]
    return statements

def generate_archive_statements(base_table: str, cutoff_date: datetime.date) -> list[str]:
    # In a real scenario, this would query the DB for existing partitions
    # and find those where the upper bound is <= cutoff_date.
    # For now, it just yields a conceptual drop statement.
    return [
        f"-- Assuming archiving to R2 is complete for partitions older than {cutoff_date}",
        f"-- DROP TABLE IF EXISTS {base_table}_historical;"
    ]

def main():
    parser = argparse.ArgumentParser(description="Manage database partitions")
    parser.add_argument("--create-upcoming", action="store_true", help="Create partitions for next 3 months")
    parser.add_argument("--archive-older-than", type=int, metavar="DAYS", help="Archive and drop partitions older than N days")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL without executing")
    
    args = parser.parse_args()
    
    tables = ["usage_logs", "telemetry_metrics"]
    statements = []
    
    if args.create_upcoming:
        today = datetime.date.today()
        for i in range(1, 4):
            target = today + relativedelta(months=i)
            for tbl in tables:
                statements.extend(generate_partition_statements(tbl, target))
                
    if args.archive_older_than is not None:
        cutoff = datetime.date.today() - datetime.timedelta(days=args.archive_older_than)
        for tbl in tables:
            statements.extend(generate_archive_statements(tbl, cutoff))
            
    if args.dry_run:
        print("--- DRY RUN: Partition Management SQL ---")
        for stmt in statements:
            print(stmt)
    else:
        # Here it would connect to the database and execute
        print("Executing statements (dry-run mode is off)...")
        for stmt in statements:
            print(f"Executing: {stmt}")
        print("Done.")

if __name__ == "__main__":
    main()
