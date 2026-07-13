import Link from "next/link";

type Node = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  managerId: string | null;
};

function TreeNode({
  node,
  childrenByManager,
}: {
  node: Node;
  childrenByManager: Map<string, Node[]>;
}) {
  const children = childrenByManager.get(node.id) ?? [];
  return (
    <li>
      <Link href={`/employees/${node.id}`} className="hover:underline">
        {node.lastName} {node.firstName}
      </Link>
      <span className="text-muted-foreground"> · {node.title}</span>
      {children.length > 0 && (
        <ul className="mt-1 ml-4 list-disc space-y-1 border-l pl-4">
          {children.map((child) => (
            <TreeNode key={child.id} node={child} childrenByManager={childrenByManager} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgTree({ employees, rootId }: { employees: Node[]; rootId: string }) {
  const root = employees.find((e) => e.id === rootId);
  if (!root) return null;

  const childrenByManager = new Map<string, Node[]>();
  for (const emp of employees) {
    if (!emp.managerId) continue;
    const list = childrenByManager.get(emp.managerId) ?? [];
    list.push(emp);
    childrenByManager.set(emp.managerId, list);
  }

  return (
    <ul className="space-y-1 text-sm">
      <TreeNode node={root} childrenByManager={childrenByManager} />
    </ul>
  );
}
