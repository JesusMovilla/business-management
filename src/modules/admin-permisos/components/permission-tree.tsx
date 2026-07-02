"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ACTION_LABELS, PERMISSION_ACTIONS } from "@/lib/rbac/actions";
import { MODULE_LABELS } from "@/lib/rbac/modules";
import type { AppModule, PermissionAction, PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";

interface PermissionTreeEditorProps {
	permissions: PermissionTree;
	onToggle: (module: AppModule, action: PermissionAction) => void;
	disabled?: boolean;
}

export function PermissionTreeEditor({
	permissions,
	onToggle,
	disabled,
}: PermissionTreeEditorProps) {
	const findEntry = (module: AppModule) =>
		permissions.find((entry) => entry.module === module);

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Módulo</TableHead>
						{PERMISSION_ACTIONS.map((action) => (
							<TableHead key={action} className="text-center">
								{ACTION_LABELS[action]}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{APP_MODULES.map((module) => {
						const entry = findEntry(module);
						return (
							<TableRow key={module}>
								<TableCell className="font-medium">
									{MODULE_LABELS[module]}
								</TableCell>
								{PERMISSION_ACTIONS.map((action) => (
									<TableCell key={action} className="text-center">
										<Checkbox
											checked={entry?.actions[action] ?? false}
											onCheckedChange={() => onToggle(module, action)}
											disabled={disabled}
										/>
									</TableCell>
								))}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
