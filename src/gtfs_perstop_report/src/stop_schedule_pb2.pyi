from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Epsg25829(_message.Message):
    __slots__ = ()
    X_FIELD_NUMBER: _ClassVar[int]
    Y_FIELD_NUMBER: _ClassVar[int]
    x: float
    y: float
    def __init__(
        self, x: _Optional[float] = ..., y: _Optional[float] = ...
    ) -> None: ...

class StopArrivals(_message.Message):
    __slots__ = ()
    class ScheduledArrival(_message.Message):
        __slots__ = ()
        SERVICE_ID_FIELD_NUMBER: _ClassVar[int]
        TRIP_ID_FIELD_NUMBER: _ClassVar[int]
        LINE_FIELD_NUMBER: _ClassVar[int]
        ROUTE_FIELD_NUMBER: _ClassVar[int]
        SHAPE_ID_FIELD_NUMBER: _ClassVar[int]
        SHAPE_DIST_TRAVELED_FIELD_NUMBER: _ClassVar[int]
        STOP_SEQUENCE_FIELD_NUMBER: _ClassVar[int]
        NEXT_STREETS_FIELD_NUMBER: _ClassVar[int]
        STARTING_CODE_FIELD_NUMBER: _ClassVar[int]
        STARTING_NAME_FIELD_NUMBER: _ClassVar[int]
        STARTING_TIME_FIELD_NUMBER: _ClassVar[int]
        CALLING_TIME_FIELD_NUMBER: _ClassVar[int]
        CALLING_SSM_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_CODE_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_NAME_FIELD_NUMBER: _ClassVar[int]
        TERMINUS_TIME_FIELD_NUMBER: _ClassVar[int]
        service_id: str
        trip_id: str
        line: str
        route: str
        shape_id: str
        shape_dist_traveled: float
        stop_sequence: int
        next_streets: _containers.RepeatedScalarFieldContainer[str]
        starting_code: str
        starting_name: str
        starting_time: str
        calling_time: str
        calling_ssm: int
        terminus_code: str
        terminus_name: str
        terminus_time: str
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
        ) -> None: ...

    STOP_ID_FIELD_NUMBER: _ClassVar[int]
    LOCATION_FIELD_NUMBER: _ClassVar[int]
    ARRIVALS_FIELD_NUMBER: _ClassVar[int]
    stop_id: str
    location: Epsg25829
    arrivals: _containers.RepeatedCompositeFieldContainer[StopArrivals.ScheduledArrival]
    def __init__(
        self,
        stop_id: _Optional[str] = ...,
        location: _Optional[_Union[Epsg25829, _Mapping]] = ...,
        arrivals: _Optional[
            _Iterable[_Union[StopArrivals.ScheduledArrival, _Mapping]]
        ] = ...,
    ) -> None: ...
