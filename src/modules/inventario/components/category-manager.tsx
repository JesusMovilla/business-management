"use client";

import { Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCatalogStore } from "@/stores/catalog-store";
import { CategoryFormDialog } from "./category-form";

export function CategoryManager() {
	const categories = useCatalogStore((state) => state.categories);
	const removeCategory = useCatalogStore((state) => state.removeCategory);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<PermissionGuard module="inventario" action="crear">
					<CategoryFormDialog onCreated={() => {}} />
				</PermissionGuard>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nombre</TableHead>
							<TableHead>Descripción</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{categories.map((category) => (
							<TableRow key={category.id}>
								<TableCell className="font-medium">{category.name}</TableCell>
								<TableCell className="text-muted-foreground">
									{category.description ?? "—"}
								</TableCell>
								<TableCell>
									<PermissionGuard module="inventario" action="eliminar">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => removeCategory(category.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</PermissionGuard>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
