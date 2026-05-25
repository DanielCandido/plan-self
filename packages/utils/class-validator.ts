import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function IsCuid(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isCuid',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    // cuid v1
                    return /^c[a-z0-9]{24}$/i.test(value);
                },

                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid cuid`;
                },
            },
        });
    };
}