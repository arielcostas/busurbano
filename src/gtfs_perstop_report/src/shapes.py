import csv
from dataclasses import dataclass
import os
from typing import Dict, Optional

from pyproj import Transformer

from src.logger import get_logger


logger = get_logger("shapes")


@dataclass
class Shape:
    shape_id: str
    shape_pt_lat: Optional[float]
    shape_pt_lon: Optional[float]
    shape_pt_position: Optional[int]
    shape_dist_traveled: Optional[float]

    shape_pt_25829_x: Optional[float] = None
    shape_pt_25829_y: Optional[float] = None


def process_shapes(feed_dir: str, out_dir: str) -> None:
    file_path = os.path.join(feed_dir, "shapes.txt")
    shapes: Dict[str, list[Shape]] = {}

    transformer = Transformer.from_crs(4326, 25829, always_xy=True)

    try:
        with open(file_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f, quotechar='"', delimiter=",")
            for row_num, row in enumerate(reader, start=2):
                try:
                    shape = Shape(
                        shape_id=row["shape_id"],
                        shape_pt_lat=float(row["shape_pt_lat"])
                        if row.get("shape_pt_lat")
                        else None,
                        shape_pt_lon=float(row["shape_pt_lon"])
                        if row.get("shape_pt_lon")
                        else None,
                        shape_pt_position=int(row["shape_pt_position"])
                        if row.get("shape_pt_position")
                        else None,
                        shape_dist_traveled=float(row["shape_dist_traveled"])
                        if row.get("shape_dist_traveled")
                        else None,
                    )

                    if (
                        shape.shape_pt_lat is not None
                        and shape.shape_pt_lon is not None
                    ):
                        shape_pt_25829_x, shape_pt_25829_y = transformer.transform(
                            shape.shape_pt_lon, shape.shape_pt_lat
                        )
                        shape.shape_pt_25829_x = shape_pt_25829_x
                        shape.shape_pt_25829_y = shape_pt_25829_y

                    if shape.shape_id not in shapes:
                        shapes[shape.shape_id] = []
                    shapes[shape.shape_id].append(shape)
                except Exception as e:
                    logger.warning(
                        f"Error parsing stops.txt line {row_num}: {e} - line data: {row}"
                    )
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
    except Exception as e:
        logger.error(f"Error reading stops.txt: {e}")

    # Write shapes to Protobuf files
    from src.proto.stop_schedule_pb2 import Epsg25829, Shape as PbShape

    for shape_id, shape_points in shapes.items():
        points = sorted(
            shape_points,
            key=lambda sp: sp.shape_pt_position
            if sp.shape_pt_position is not None
            else 0,
        )

        pb_shape = PbShape(
            shape_id=shape_id,
            points=[
                Epsg25829(x=pt.shape_pt_25829_x, y=pt.shape_pt_25829_y)
                for pt in points
                if pt.shape_pt_25829_x is not None and pt.shape_pt_25829_y is not None
            ],
        )

        shape_file_path = os.path.join(out_dir, "shapes", f"{shape_id}.pb")
        os.makedirs(os.path.dirname(shape_file_path), exist_ok=True)

        try:
            with open(shape_file_path, "wb") as f:
                f.write(pb_shape.SerializeToString())
            logger.debug(f"Shape Protobuf written to: {shape_file_path}")
        except Exception as e:
            logger.error(f"Error writing shape Protobuf to {shape_file_path}: {e}")
