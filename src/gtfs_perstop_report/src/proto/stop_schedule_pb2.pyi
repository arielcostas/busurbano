from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import (
    ClassVar as _ClassVar,
    Iterable as _Iterable,
    Mapping as _Mapping,
    Optional as _Optional,
    Union as _Union,
)

DESCRIPTOR: _descriptor.FileDescriptor

class Epsg25829(_message.Message):
    __slots__ = ["x", "y"]
    X_FIELD_NUMBER: _ClassVar[int]
    Y_FIELD_NUMBER: _ClassVar[int]
    x: float
    y: float
    def __init__(
        self, x: _Optional[float] = ..., y: _Optional[float] = ...
    ) -> None: ...

class Shape(_message.Message):
    __slots__ = ["points", "shape_id"]
    POINTS_FIELD_NUMBER: _ClassVar[int]
    SHAPE_ID_FIELD_NUMBER: _ClassVar[int]
    points: _containers.RepeatedCompositeFieldContainer[Epsg25829]
    shape_id: str
    def __init__(
        self,
        shape_id: _Optional[str] = ...,
        points: _Optional[_Iterable[_Union[Epsg25829, _Mapping]]] = ...,
    ) -> None: ...

class StopArrivals(_message.Message):
    __slots__ = ["arrivals", "location", "stop_id"]
    class ScheduledArrival(_message.Message):
        __slots__ = [
            "calling_ssm",
            "calling_time",
            "line",
            "next_streets",
            "previous_trip_shape_id",
            "route",
            "service_id",
            "shape_dist_traveled",
            "shape_id",
            "starting_code",
            "starting_name",
            "starting_time",
            "stop_sequence",
            "terminus_code",
            "terminus_name",
            "terminus_time",
            "trip_id",
        ]
        CALLING_SSM_FIELD_NUMBER: _ClassVar[int]
        CALLING_TIME_FIELD_NUMBER: _ClassVar[int]
        LINE_FIELD_NUMBER: _ClassVar[int]
        NEXT_STREETS_FIELD_NUMBER: _ClassVar[int]
        PREVIOUS_TRIP_SHAPE_ID_FIELD_NUMBER: _ClassVar[int]
        ROUTE_FIELD_NUMBER: _ClassVar[int]
        SERVICE_ID_FIELD_NUMBER: _ClassVar[int]
        SHAPE_DIST_TRAVELED_FIELD_NUMBER: _ClassVar[int]
        SHAPE_ID_FIELD_NUMBER: _ClassVar[int]
        STARTING_CODE_FIELD_NUMBER: _ClassVar[int]
        STARTING_NAME_FIELD_NUMBER: _ClassVar[int]
        STARTING_TIME_FIELD_NUMBER: _ClassVar[int]
        STOP_SEQUENCE_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_CODE_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_NAME_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_TIME_FIELD_NUMBER: _ClassVar[int]
        TRIP_ID_FIELD_NUMBER: _ClassVar[int]
        calling_ssm: int
        calling_time: str
        line: str
        next_streets: _containers.RepeatedScalarFieldContainer[str]
        previous_trip_shape_id: str
        route: str
        service_id: str
        shape_dist_traveled: float
        shape_id: str
        starting_code: str
        starting_name: str
        starting_time: str
        stop_sequence: int
        terminus_code: str
        terminus_name: str
        terminus_time: str
        trip_id: str
        def __init__(
            self,
            service_id: _Optional[str] = ...,
            trip_id: _Optional[str] = ...,
            line: _Optional[str] = ...,
            route: _Optional[str] = ...,
            shape_id: _Optional[str] = ...,
            shape_dist_traveled: _Optional[float] = ...,
            stop_sequence: _Optional[int] = ...,
            next_streets: _Optional[_Iterable[str]] = ...,
            starting_code: _Optional[str] = ...,
            starting_name: _Optional[str] = ...,
            starting_time: _Optional[str] = ...,
            calling_time: _Optional[str] = ...,
            calling_ssm: _Optional[int] = ...,
            terminus_code: _Optional[str] = ...,
            terminus_name: _Optional[str] = ...,
            terminus_time: _Optional[str] = ...,
            previous_trip_shape_id: _Optional[str] = ...,
        ) -> None: ...

    ARRIVALS_FIELD_NUMBER: _ClassVar[int]
    LOCATION_FIELD_NUMBER: _ClassVar[int]
    STOP_ID_FIELD_NUMBER: _ClassVar[int]
    arrivals: _containers.RepeatedCompositeFieldContainer[StopArrivals.ScheduledArrival]
    location: Epsg25829
    stop_id: str
    def __init__(
        self,
        stop_id: _Optional[str] = ...,
        location: _Optional[_Union[Epsg25829, _Mapping]] = ...,
        arrivals: _Optional[
            _Iterable[_Union[StopArrivals.ScheduledArrival, _Mapping]]
        ] = ...,
    ) -> None: ...
