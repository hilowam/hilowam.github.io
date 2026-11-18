"""Render the abstract assembly clips with rsvg-convert and ffmpeg."""

from math import cos, radians, sin
from pathlib import Path
from subprocess import PIPE, Popen, run


OUTPUT = Path(__file__).resolve().parents[1] / 'static/figures/insight'


def roof_grip(x, y, angle, jaw):
    rotation = radians(angle)
    return x + 28 * sin(rotation), y - 28 * cos(rotation), angle, jaw


def pose(time, base, roof, grip):
    return time, (*base, *roof, *grip)


BASE_START, BASE_SET = (53, 106), (145, 106)
ROOF_START = (237, 111, 28)
ROOF_ABOVE = (145, 62, 0)
ROOF_SET = (145, 76, 0)
STORY = (
    pose(0, BASE_START, ROOF_START, (53, 30, 0, 29)),
    pose(.5, BASE_START, ROOF_START, (53, 30, 0, 29)),
    pose(1.02, BASE_START, ROOF_START, (53, 66, 0, 29)),
    pose(1.31, BASE_START, ROOF_START, (53, 66, 0, 24)),
    pose(1.82, (53, 74), ROOF_START, (53, 34, 0, 24)),
    pose(2.5, (145, 74), ROOF_START, (145, 34, 0, 24)),
    pose(3.06, BASE_SET, ROOF_START, (145, 66, 0, 24)),
    pose(3.34, BASE_SET, ROOF_START, (145, 66, 0, 29)),
    pose(3.85, BASE_SET, ROOF_START, (145, 27, 0, 29)),
    pose(4.46, BASE_SET, ROOF_START, (248, 33, 18, 20)),
    pose(5.12, BASE_SET, ROOF_START, roof_grip(*ROOF_START, 20)),
    pose(5.44, BASE_SET, ROOF_START, roof_grip(*ROOF_START, 14)),
    pose(5.95, BASE_SET, (228, 72, 28), roof_grip(228, 72, 28, 14)),
    pose(6.70, BASE_SET, (170, 56, -12), roof_grip(170, 56, -12, 14)),
    pose(7.22, BASE_SET, ROOF_ABOVE, roof_grip(*ROOF_ABOVE, 14)),
    pose(7.98, BASE_SET, ROOF_SET, roof_grip(*ROOF_SET, 14)),
    pose(8.22, BASE_SET, ROOF_SET, roof_grip(*ROOF_SET, 14)),
    pose(8.48, BASE_SET, ROOF_SET, roof_grip(*ROOF_SET, 21)),
    pose(8.95, BASE_SET, ROOF_SET, (145, 17, 0, 21)),
)


def at(time):
    for (start, first), (end, last) in zip(STORY, STORY[1:]):
        if time < end:
            progress = (time - start) / (end - start)
            weight = progress * progress * (3 - 2 * progress)
            return tuple(initial + weight * (final - initial) for initial, final in zip(first, last))
    return STORY[-1][1]


def svg(time, view):
    base_x, base_y, roof_x, roof_y, roof_angle, wrist_x, wrist_y, wrist_angle, jaw = at(time)
    viewport = {
        'world': '0 0 300 158',
        'state': '0 0 300 158',
        'local': '0 0 300 158',
    }[view]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="384" height="202" viewBox="{viewport}">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 14H282" stroke="#dde8e2" stroke-width="3"/>
      <path d="M25 130H276" stroke="#ccd9d3" stroke-width="2"/>
      <path d="M113 131h64l-7 6h-50z" fill="#dae7e2"/>
      <path d="M122 129v-8m46 8v-8" stroke="#a0b8ad" stroke-width="2"/>
      <path d="M{wrist_x:.2f} 14V{wrist_y:.2f}" stroke="#7fa794" stroke-width="5"/>
      <g transform="translate({base_x:.2f} {base_y:.2f})">
        <path d="M-22 23v-45H-7v7H7v-7H22v45z" fill="#7098cb" stroke="#466da4" stroke-width="2.4"/>
        <path d="M-13 11v-11h10v11z" fill="#e2edf9"/>
        <path d="M4 22V6h10v16z" fill="#4e75ac"/>
      </g>
      <g transform="translate({roof_x:.2f} {roof_y:.2f}) rotate({roof_angle:.2f})">
        <path d="M-28 5L0-18l28 23v3H7v7H-7V8h-21z" fill="#dfa064" stroke="#a96b3c" stroke-width="2.4"/>
        <path d="M-19 2L0-13l19 15" stroke="#efc69c" stroke-width="1.8"/>
      </g>
      <g transform="translate({wrist_x:.2f} {wrist_y:.2f}) rotate({wrist_angle:.2f})">
        <path d="M{-jaw:.2f} 26V14L-9 0H9L{jaw:.2f} 14V26" stroke="#37765e" stroke-width="3.8"/>
        <path d="M{-jaw:.2f} 26h3m{2 * jaw - 6:.2f} 0h3" stroke="#285844" stroke-width="4.5"/>
        <rect x="-10" y="-4" width="20" height="8" rx="3" fill="#37765e"/>
      </g>
    </g></svg>'''


def png(time, view):
    return run(['rsvg-convert'], input=svg(time, view).encode(), stdout=PIPE, check=True).stdout


def clip(name, view, rate, times, poster_time, animated_image=False):
    (OUTPUT / f'{name}.png').write_bytes(png(poster_time, view))
    command = [
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe',
        '-framerate', rate, '-vcodec', 'png', '-i', '-', '-an',
    ]
    if animated_image:
        command += ['-vf', 'scale=320:168:flags=lanczos', '-c:v', 'apng', '-plays', '0',
                    '-f', 'apng', str(OUTPUT / f'{name}-loop.png')]
    else:
        command += ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
                    '-movflags', '+faststart', str(OUTPUT / f'{name}.mp4')]
    with Popen(command, stdin=PIPE) as encoder:
        for time in times:
            encoder.stdin.write(png(time, view))
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError(f'Could not encode {name}')


if __name__ == '__main__':
    OUTPUT.mkdir(parents=True, exist_ok=True)
    clip('assembly-world', 'world', '16', (frame / 16 for frame in range(160)), 0, animated_image=True)
    clip('assembly-state', 'state', '1/2', (0, 4.4, 9.6), 0, animated_image=True)
    local_frames = (6.35 + frame / 16 for frame in range(56))
    clip('assembly-local', 'local', '16', local_frames, 8.95, animated_image=True)
