import { SchemaFormPlayground } from "./_components/schema-form-playground";

export default function SchemaFormsPage() {
  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Schema Form Playground
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a Zod schema to dynamically generate a form. Fields,
            types, and validation are all derived from the schema definition.
          </p>
        </div>

        <SchemaFormPlayground />
      </div>
    </div>
  );
}
