export interface Company {
    company_id?: number; // Optional because it's not needed when creating a new company
    company_name: string;
    company_address: string;
    company_type: string;
    block_id: number; // This will reference the block from the dropdown
}
