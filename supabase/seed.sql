-- =========================================================================
-- Supabase / PostgreSQL Seed Data for RHA DAY 26
-- Gyan Ganga Institute of Technology & Sciences (GGITS)
-- =========================================================================

-- 1. Insert Default Administrator & Sample Student
INSERT INTO public.users (id, email, phone, roll_no, name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@ggits.ac.in', '0000000000', 'ADMIN-RHA', 'GGITS Red Hat Coordinator', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'student@ggits.ac.in', '9876543210', '0208CS221001', 'Candidate Student', 'student')
ON CONFLICT (roll_no) DO NOTHING;

-- 2. Insert Default RHA DAY 26 Quiz
INSERT INTO public.quizzes (id, title, description, duration_minutes, max_violations, shuffle_questions, allow_backtracking, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'RHA DAY 26: Red Hat Enterprise Linux & Open Source Challenge',
    'Official proctored certification quiz covering RHEL fundamentals, Systemd, SELinux, Podman containers, Bash scripting, and Ansible automation for Gyan Ganga students.',
    15,
    3,
    true,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Comprehensive Question Bank for RHA DAY 26
INSERT INTO public.questions (id, quiz_id, text, type, options, correct_answer, marks, order_index)
VALUES
    (
        '22222222-2222-2222-2222-222222220001',
        '11111111-1111-1111-1111-111111111111',
        'Which daemon is responsible for managing system startup, services, and process control in modern Red Hat Enterprise Linux (RHEL)?',
        'mcq_single',
        '["SysVinit", "systemd", "Upstart", "initrd"]'::jsonb,
        '"systemd"'::jsonb,
        2,
        1
    ),
    (
        '22222222-2222-2222-2222-222222220002',
        '11111111-1111-1111-1111-111111111111',
        'In Red Hat Enterprise Linux 8 & 9, which default container engine is recommended as a daemonless, rootless alternative to Docker?',
        'mcq_single',
        '["Podman", "LXC", "CRI-O", "containerd"]'::jsonb,
        '"Podman"'::jsonb,
        2,
        2
    ),
    (
        '22222222-2222-2222-2222-222222220003',
        '11111111-1111-1111-1111-111111111111',
        'What command temporarily sets SELinux to Permissive mode without requiring a system reboot?',
        'mcq_single',
        '["setenforce 0", "selinux-disable", "getenforce permissive", "systemctl stop selinux"]'::jsonb,
        '"setenforce 0"'::jsonb,
        2,
        3
    ),
    (
        '22222222-2222-2222-2222-222222220004',
        '11111111-1111-1111-1111-111111111111',
        'Which package management tool replaced yum as the next-generation package manager in Red Hat Enterprise Linux 8?',
        'mcq_single',
        '["apt", "rpmbuild", "dnf", "zypper"]'::jsonb,
        '"dnf"'::jsonb,
        2,
        4
    ),
    (
        '22222222-2222-2222-2222-222222220005',
        '11111111-1111-1111-1111-111111111111',
        'In an Ansible Playbook, what file format is strictly utilized to describe automation tasks and plays?',
        'mcq_single',
        '["JSON", "YAML", "XML", "TOML"]'::jsonb,
        '"YAML"'::jsonb,
        2,
        5
    ),
    (
        '22222222-2222-2222-2222-222222220006',
        '11111111-1111-1111-1111-111111111111',
        'Which command displays real-time kernel ring buffer messages and hardware diagnostics in Linux?',
        'mcq_single',
        '["dmesg", "journalctl -k", "cat /proc/kmsg", "All of the above"]'::jsonb,
        '"All of the above"'::jsonb,
        2,
        6
    ),
    (
        '22222222-2222-2222-2222-222222220007',
        '11111111-1111-1111-1111-111111111111',
        'What Linux permission octal representation corresponds to: rwxr-xr--',
        'mcq_single',
        '["754", "755", "744", "654"]'::jsonb,
        '"754"'::jsonb,
        2,
        7
    ),
    (
        '22222222-2222-2222-2222-222222220008',
        '11111111-1111-1111-1111-111111111111',
        'Name the command-line utility used in RHEL to configure NetworkManager connections via interactive text user interface (TUI).',
        'short_answer',
        '[]'::jsonb,
        '"nmtui"'::jsonb,
        2,
        8
    ),
    (
        '22222222-2222-2222-2222-222222220009',
        '11111111-1111-1111-1111-111111111111',
        'Which file system is the default file system used during Red Hat Enterprise Linux installation?',
        'mcq_single',
        '["ext4", "XFS", "Btrfs", "ZFS"]'::jsonb,
        '"XFS"'::jsonb,
        2,
        9
    ),
    (
        '22222222-2222-2222-2222-222222220010',
        '11111111-1111-1111-1111-111111111111',
        'In Git, which command safely combines divergent branches while keeping a linear commit history instead of generating a merge commit?',
        'mcq_single',
        '["git rebase", "git merge --no-ff", "git squash", "git cherry-pick"]'::jsonb,
        '"git rebase"'::jsonb,
        2,
        10
    )
ON CONFLICT (id) DO NOTHING;
