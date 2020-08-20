export const erdFieldsSql = `SET enable_nestloop=0;
SELECT 'postgresql' AS dbms,
		t.table_catalog,
		t.table_schema,
		t.table_name,
		c.column_name,
		c.ordinal_position,
		c.data_type,
		c.character_maximum_length,
		n.constraint_type,
		k2.table_schema as fk_table_schema,
		k2.table_name as fk_table_name,
		k2.column_name as fk_column_name,
		case c.is_nullable
            when 'NO' then 'N-N'
            when 'YES' then 'NULL'
       end as nullable
	FROM information_schema.tables t 
	NATURAL LEFT JOIN information_schema.columns c 
	LEFT JOIN(
		information_schema.key_column_usage k 
		NATURAL JOIN information_schema.table_constraints n 
		NATURAL LEFT JOIN information_schema.referential_constraints r)
	ON 
		c.table_catalog=k.table_catalog AND 
		c.table_schema=k.table_schema AND 
		c.table_name=k.table_name AND 
		c.column_name=k.column_name 
		LEFT JOIN information_schema.key_column_usage k2 ON 
			k.position_in_unique_constraint=k2.ordinal_position AND 
			r.unique_constraint_catalog=k2.constraint_catalog AND 
			r.unique_constraint_schema=k2.constraint_schema AND 
			r.unique_constraint_name=k2.constraint_name 
		WHERE 
			t.TABLE_TYPE='BASE TABLE' AND 
			t.table_schema 
		NOT IN('information_schema','pg_catalog');`;