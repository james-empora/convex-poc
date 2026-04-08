"use client";

import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/composite/user-avatar";
import type { PortalEscrowOfficer } from "@/lib/portal/fake-data";

interface PortalTitleTeamProps {
  officer: PortalEscrowOfficer;
}

interface TeamMember {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export function PortalTitleTeam({ officer }: PortalTitleTeamProps) {
  const team: TeamMember[] = [
    {
      name: officer.name,
      role: "Escrow Officer",
      email: officer.email,
      phone: officer.phone,
    },
    {
      name: "Pending Assignment",
      role: "Title Curative",
    },
    {
      name: "Pending Assignment",
      role: "Signing Coordinator",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-onyx-40">
        Your Title Team
      </h2>
      <div className="space-y-2">
        {team.map((member) => (
          <Card key={member.role} size="sm">
            <CardContent className="flex items-center gap-3">
            <UserAvatar name={member.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-onyx-100">
                {member.name}
              </p>
              <p className="text-sm text-onyx-50">{member.role}</p>
              {(member.email || member.phone) && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1.5 text-sm text-sapphire-60 hover:text-sapphire-70"
                    >
                      <Mail className="h-3 w-3 shrink-0" />
                      {member.email}
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-1.5 text-sm text-sapphire-60 hover:text-sapphire-70"
                    >
                      <Phone className="h-3 w-3 shrink-0" />
                      {member.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
