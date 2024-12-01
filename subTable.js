

JSON.encode = data => {
    if (!data instanceof Object) {
        console.log('data não é um objeto!')
        return []
    }
    return btoa(JSON.stringify(data));
}
JSON.decode = encodedData => {
    if (encodedData === null) {
        console.log('data vazio!')
        return "[]"
    }
    return JSON.parse(atob(encodedData));
}

const setSubTable = (subTableDiv) => {
    try {
        const dataInput = subTableDiv.querySelector('input[type="text"]:first-of-type');
           
        let data
        try {
            data = JSON.decode(dataInput.value)
        } catch (error) {
            console.log('O valor obtido de DATA não condiz com o padrão necessário para JSON')
            data = []
        }
    
    
        let config
        try {
            config = JSON.parse(subTableDiv.getAttribute("data-config").replaceAll("'", '"'))
        } catch (error) {
            console.log('O valor obtido de CONFIG não condiz com o padrão necessário para JSON')
            config = []
        }
    
        const gridStyle = '3rem' + config.reduce((styleParam, { size }) => {
            return styleParam += ` ${size}`
        }, '') + ` 3rem 3rem`
    
        //------------------------------------------------
    
    
        const createTag = ({ tag, content, events, classList }) => {
            const el = document.createElement(tag)
            if (el && content) {
                el.innerText = content
            }
            if (el && events instanceof Object) {
                events.forEach(({ dispatch, action }) => {
                    el.addEventListener(dispatch, action)
                })
            }
            if (el && classList instanceof Object) {
                classList.forEach(classItem => {
                    el.classList.add(classItem)
                })
            }
            return el
        }
    
        const updateInputValue = (data) => {
            dataInput.value = JSON.stringify(data).replaceAll("'", '"')
        }
    
        //--------------------------------------------------
    
        const formatField = ([type, detail], value) => {
            switch (type) {
                case 'currency':
                    return value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: detail,
                        maximumFractionDigits: detail
                    });
                case 'percent':
                    return `${(value).toFixed(detail)}%`;
                case 'float':
                    return parseFloat(value).toFixed(detail);
                case 'text':
                    return String(value)
                        .replace(/'/g, '')
                        .toLowerCase()
                        .replace(/^\w/, char => char.toUpperCase());
                default:
                    return value;
            }
        };
    
        const showForm = (target, index = null) => {
            const form = target.parentNode
            form.classList.remove(...form.classList)
            form.classList.add('form')
            form.style.gridTemplateColumns = gridStyle
            form.textContent = ''
            form.append(...setForm(index))
        }
    
        const collectForm = (form, index = null) => {
            const list = form.filter(item => item.tagName.toLowerCase() !== 'button').map((item) => {
                return item.value
            })
            const listHandled = config.map(({ field }, i) => {
                let listValue = null
                switch (field.format[0]) {
                    case 'currency':
                    case 'percent':
                    case 'float':
                        listValue = parseFloat(list[i] ? list[i].replaceAll(',', '.') : 0)
                        break
                    case 'text':
                        listValue = String(list[i])
                            .replace(/'/g, '')
                            .toLowerCase()
                            .replace(/^\w/, char => char.toUpperCase());
                        break
                    default:
                        listValue = null
                        break
                }
                if (field.type === 'calculated') {
                    const expression = field.origin.reduce((exp, item) => {
                        return exp += (typeof item === 'number') ? parseFloat(list[item] ? list[item].replaceAll(',', '.') : 0) : item
                    }, '')
                    listValue = parseFloat(new Function('return ' + expression)())
                }
                return listValue
            })
    
            
            const LineResult = config.reduce((obj, { field }, index) => {
                obj[field.name] = listHandled[index];
                return obj;
            }, {});
    
            editLine(index, LineResult)
        }
    
        const setForm = (index = null) => {
    
            const lineData = index && data[index]
            const frm_new = config.reduce((formHtml, { field }) => {
                const { name, type, format, pattern, required } = field
    
                switch (type) {
                    case 'select':
                        const slt_field = document.createElement('select');
                        const opt_subField = document.createElement('option');
                        opt_subField.disabled = true
                        opt_subField.selected = (lineData) ? null : true
                        slt_field.appendChild(opt_subField);
                        if (field.origin) {
                            field.origin.forEach(({ label, value }) => {
                                const opt_subField = document.createElement('option');
                                opt_subField.value = value;
                                opt_subField.textContent = label;
                                if (lineData && lineData[name] === value) {
                                    opt_subField.selected = true;
                                }
                                slt_field.appendChild(opt_subField);
                            });
                        }
                        if (required) slt_field.required = required;
                        slt_field.name = name
                        slt_field.autocomplete = 'off'
                        formHtml.push(slt_field)
                        return formHtml
                    
                    case 'input':
                        const ipt_field = document.createElement('input');
                        ipt_field.type = field.inputType || 'text';
                        if (pattern) {
                            ipt_field.pattern = pattern;
                        }
                        if (lineData && lineData[name] !== undefined) {
                            if (format[0] === 'float' || format[0] === 'currency') {
                                ipt_field.value = String(lineData[name]).replace('.',','); 
                            } else {
                               ipt_field.value = lineData[name]; 
                            }
                        }
                        if (required) ipt_field.required = required;
                        ipt_field.name = name
                        ipt_field.autocomplete = 'off'
                        formHtml.push(ipt_field)
                        return formHtml
                    
                    case 'calculated':                    
                        const spn_field = document.createElement('span');
                        formHtml.push(spn_field)
                        return formHtml
                    default:
                        break;
                }
            }, [])
            frm_new.push(
                createTag({ tag: 'button', content: 'save', events: [{ dispatch: 'click', action: () => { collectForm(frm_new, index)} }] }),
                createTag({ tag: 'button', content: 'cancel', events: [{ dispatch: 'click', action: renderTable }] })
            )
            return frm_new;
        };
    
        const editLine = (index, values) => {
            if (index) {
                data[index] = values
            } else {
                data.push(values)
            }
            updateInputValue(data)
            renderTable();
        }
    
        const deleteLine = (line) => {
            data.splice(line, 1);
            updateInputValue(data)
            renderTable();
        }
    
        const content = createTag({ tag: 'div', classList: ['content'] })
        subTableDiv.append(content)
    
    
        const createHeader = () => {
            const lineHeader = createTag({tag:'div', classList:['header']})
            lineHeader.style.gridTemplateColumns = gridStyle
    
            const spn_headers_list = config.reduce((list, { label }) => {
                list.push(createTag({tag:'span', content:label}))
                return list
            }, [])
    
            const spn_actions = createTag({ tag: 'span', content: 'Ações' })
    
            lineHeader.append( ...spn_headers_list, spn_actions)
    
            return lineHeader
        }
    
        const createBody = () => {
            const formats = config.map(field => field.field.format)
    
            const createLineBody = (dataLine, indexLine) => {
                const lineBody = createTag({ tag: 'div', classList: ['body'] })
                lineBody.style.gridTemplateColumns = gridStyle
    
                const spn_index = createTag({ tag: 'span', content: `#${indexLine}`})
                
                const spn_columns = Object.entries(dataLine).reduce((line, [_, value], index) => {
                    const field = createTag({ tag: 'span', content: formatField(formats[index], value) })
                    line.push(field)
                    return line
                }, [])
    
                const btn_actions = [
                    createTag({ tag: 'button', content: 'edit', events: [{ dispatch: 'click', action: ({ target }) => { showForm(target, indexLine) } },] }),
                    createTag({ tag: 'button', content: 'delete', events: [{ dispatch: 'click', action: (() => { deleteLine(indexLine) }) },] }),
                ]
                lineBody.append(spn_index, ...spn_columns, ...btn_actions)
                return lineBody
            }
            return data.map((line, index) => {
                return createLineBody(line, index)
            })
        }
        const createNew = () => {
            const lineHeader = document.createElement('div')
            lineHeader.classList.add('new')
            lineHeader.id = 'formNew'
            lineHeader.style.gridTemplateColumns = '1fr'
            const btn_add = createTag({ tag: 'button', content: 'add_circle', events: [{ dispatch: 'click', action: ({ target }) => { showForm(target) } },] })
            lineHeader.appendChild(btn_add)
            return lineHeader
        }
    
        const createFooter = () => {
            const formats = config.map(({ field }) => {
                const { acumulator, format } = field
                return { acumulator, format }
            })
    
            const lineFooter = createTag({ tag: 'div', classList: ['footer'] })
            lineFooter.style.gridTemplateColumns = gridStyle
    
            const spn_index = createTag({ tag: 'span', classList: ['null'] })
        
            if (data.length > 0) {
                const totais = formats.reduce((result, { acumulator, format }, index) => {
                    if (acumulator === "count") {
                        result.push({ index, value: `${data.length} ${(data.length > 1) ? 'itens' : `item`}`, raw: data.length});
                    } else if (acumulator === "amount") {
                        const fieldKey = Object.keys(data[0])[index];
                        let sum = data.reduce((total, item) => total + (item[fieldKey] || 0), 0);
                        result.push({ index, value: formatField(format, sum), raw: String(sum).replaceAll('.',',')});
                    } else {
                        result.push({ index, value: null, raw: null });
                    }
                    return result;
                }, []);
    
                const content = totais.reduce((line, { value }) => {
                    line.push(createTag({ tag: 'span', content: value ? value : '', classList: [!value ? 'null' : 'notNull'] }))
                    return line
                }, [])
                content.push(
                    createTag({ tag: 'span', classList: ['null'] }), createTag({ tag: 'span', classList: ['null'] })
                )
                setSecundaryValues(totais)
                lineFooter.append(spn_index, ...content)
            }
            return lineFooter
        }

        const setSecundaryValues = (totais) => {
            const x = totais.filter(item => item.raw)
            const y = subTableDiv.querySelectorAll('input[type="text"]:not(:first-of-type)');

            y.forEach((item, index) => {
                item.value = x[index].raw
                item.id = 'i' + x[index].index
            })
            console.log(y);
        }
    
        const renderTable = () => {
            content.textContent = ''
            content.append(
                createHeader(),
                ...createBody(),
                createNew(),
                createFooter()
            )
        }
        renderTable()
    } catch (error) {
        console.log('Erro ao implementar subtable: ' + error)
    }
}

document.querySelectorAll('.subTable').forEach(el => setSubTable(el))