import os
import json
import re


class Command:
    def __init__(
        self,
        name: str,
        description: list[str],
        command_lines: list[str],
        dependencies: list[str],
    ):
        self.name = name
        self.description = description
        self.command_lines = command_lines
        self.dependencies = dependencies


def parse_commands(lines):
    commands = []
    while lines:
        next_command = parse_command(lines)
        if next_command:
            commands.append(next_command)
        else:
            lines.pop(0)  # remove other lines
    return commands


def parse_command(lines):
    name_line = parse_name_line(lines)
    if not name_line:
        return None

    name_parts = name_line.split(":")
    name = name_parts[0].strip()
    dependencies_str = name_parts[1].strip()
    dependencies = dependencies_str.split() if dependencies_str else []

    if not name:
        return None

    description = list(parse_description(lines))
    if not description:
        return None

    commands = list(parse_command_lines(lines))

    return Command(name, description, commands, dependencies)


def parse_name_line(lines):
    if not lines:
        return None
    if re.match(r"^[a-zA-Z0-9_-]+:", lines[0]) is None:
        return None
    else:
        return lines.pop(0)


def parse_description(lines):
    while lines:
        next_line = parse_description_line(lines)

        if next_line:
            yield next_line
        else:
            break


def parse_description_line(lines):
    if not lines:
        return None
    if not lines[0].startswith("# "):
        return None
    return lines.pop(0)[1:].strip()


def parse_command_lines(lines):
    while lines:
        next_command = parse_command_line(lines)
        if next_command:
            yield next_command
        else:
            break


def parse_command_line(lines):
    if not lines or not lines[0].startswith("\t"):
        return
    else:
        return lines.pop(0).strip()


args = os.sys.argv[1:]

makefile_path = os.path.join(os.getcwd(), "Makefile")

# must exist
assert os.path.exists(makefile_path)

# get lines
f = open(makefile_path, "r")
lines = f.readlines()
commands = parse_commands(lines)

# sort commands by name
commands.sort(key=lambda x: x.name)

# json encode and print
print(
    json.dumps(
        [command.__dict__ for command in commands],
        indent=4,
    )
)

# for command in commands:
#     print(command)
