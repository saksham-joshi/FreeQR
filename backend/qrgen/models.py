from typing import Annotated, Literal

from pydantic import BaseModel, Field

HexColor = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]

Format = Literal["svg", "png", "jpg"]
PatternStyle = Literal["square", "rounded", "dots", "diamond", "heart", "star", "leaf", "bars"]
FrameStyle = Literal["square", "rounded", "circle", "leaf", "drop", "chamfer", "dotted"]
DotStyle = Literal["square", "rounded", "circle", "diamond", "heart", "star", "leaf"]


class Fill(BaseModel):
    type: Literal["solid", "linear", "radial"] = "solid"
    color: HexColor = "#5C4B8A"
    color2: HexColor = "#00979A"
    # Direction of a linear gradient in degrees: 0 runs left to right, 90 top to bottom.
    angle: float = Field(45, ge=0, le=360)


class Background(BaseModel):
    transparent: bool = False
    color: HexColor = "#FFFFFF"


class Pattern(BaseModel):
    style: PatternStyle = "rounded"
    fill: Fill = Field(default_factory=Fill)


class CornerFrame(BaseModel):
    style: FrameStyle = "rounded"
    color: HexColor = "#5C4B8A"


class CornerDot(BaseModel):
    style: DotStyle = "rounded"
    color: HexColor = "#5C4B8A"


class CenterImage(BaseModel):
    data_url: str = Field(max_length=4_000_000)
    # Side of the picture as a fraction of the code's side.
    size: float = Field(0.22, ge=0.1, le=0.35)
    clear_behind: bool = True


class QROptions(BaseModel):
    data: str = Field(min_length=1, max_length=2048)
    format: Format = "svg"
    width: int = Field(1024, ge=64, le=4096)
    height: int = Field(1024, ge=64, le=4096)
    margin_x: int = Field(80, ge=0, le=2048)
    margin_y: int = Field(80, ge=0, le=2048)
    background: Background = Field(default_factory=Background)
    pattern: Pattern = Field(default_factory=Pattern)
    corner_frame: CornerFrame = Field(default_factory=CornerFrame)
    corner_dot: CornerDot = Field(default_factory=CornerDot)
    image: CenterImage | None = None
