from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_PATH = Path(__file__).with_name("presenceboard-erd.png")
WIDTH = 1400
HEIGHT = 900
BACKGROUND = "#f5f7fa"
SURFACE = "#ffffff"
BORDER = "#c7d1dc"
HEADER = "#102a43"
TEXT = "#17202a"
MUTED = "#667385"
LINE = "#2563eb"

TABLES = [
    {
        "name": "organizers",
        "x": 70,
        "y": 70,
        "width": 360,
        "fields": [
            "id  PK",
            "name",
            "email  UNIQUE",
            "password_hash",
            "created_at",
        ],
    },
    {
        "name": "event_groups",
        "x": 510,
        "y": 70,
        "width": 360,
        "fields": [
            "id  PK",
            "title",
            "description",
            "start_date",
            "end_date",
            "recurrence",
            "organizer_id  FK",
        ],
    },
    {
        "name": "events",
        "x": 950,
        "y": 70,
        "width": 380,
        "fields": [
            "id  PK",
            "start_time",
            "end_time",
            "sequence_number",
            "access_code  UNIQUE",
            "event_group_id  FK",
            "UNIQUE(event_group_id, sequence_number)",
        ],
    },
    {
        "name": "attendance_records",
        "x": 950,
        "y": 540,
        "width": 380,
        "fields": [
            "id  PK",
            "participant_name",
            "participant_email",
            "checked_in_at",
            "event_id  FK",
            "UNIQUE(event_id, participant_email)",
        ],
    },
]


def load_font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]

    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass

    return ImageFont.load_default()


def table_bounds(table):
    row_height = 36
    header_height = 52
    table_width = table.get("width", 360)
    table_height = header_height + row_height * len(table["fields"]) + 18
    return (table["x"], table["y"], table["x"] + table_width, table["y"] + table_height)


def draw_table(draw, table, field_font, header_font, small_font):
    left, top, right, bottom = table_bounds(table)
    draw.rounded_rectangle((left, top, right, bottom), radius=14, fill=SURFACE, outline=BORDER, width=2)
    draw.rounded_rectangle((left, top, right, top + 56), radius=14, fill=HEADER)
    draw.rectangle((left, top + 36, right, top + 56), fill=HEADER)
    draw.text((left + 20, top + 14), table["name"], fill="#ffffff", font=header_font)

    y = top + 70
    for field in table["fields"]:
        color = TEXT if "PK" in field or "FK" in field or "UNIQUE" in field else MUTED
        font = small_font if field.startswith("UNIQUE(") else field_font
        draw.text((left + 20, y), field, fill=color, font=font)
        y += 36


def draw_relation(draw, start, end, font):
    draw.line((start, end), fill=LINE, width=4)
    sx, sy = start
    ex, ey = end

    if abs(sy - ey) <= abs(sx - ex):
        draw.text((sx + 14, sy - 28), "1", fill=LINE, font=font)
        draw.text((ex - 28, ey - 28), "N", fill=LINE, font=font)
    else:
        draw.text((sx + 16, sy + 8), "1", fill=LINE, font=font)
        draw.text((ex + 16, ey - 30), "N", fill=LINE, font=font)


def main():
    header_font = load_font(24, bold=True)
    field_font = load_font(19)
    small_font = load_font(16)
    cardinality_font = load_font(20, bold=True)

    image = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND)
    draw = ImageDraw.Draw(image)

    for table in TABLES:
        draw_table(draw, table, field_font, header_font, small_font)

    organizer = table_bounds(TABLES[0])
    event_group = table_bounds(TABLES[1])
    event = table_bounds(TABLES[2])
    attendance = table_bounds(TABLES[3])

    draw_relation(draw, (organizer[2], organizer[1] + 146), (event_group[0], event_group[1] + 146), cardinality_font)
    draw_relation(draw, (event_group[2], event_group[1] + 146), (event[0], event[1] + 146), cardinality_font)
    draw_relation(draw, (event[0] + 190, event[3]), (attendance[0] + 190, attendance[1]), cardinality_font)

    image.save(OUTPUT_PATH)


if __name__ == "__main__":
    main()
